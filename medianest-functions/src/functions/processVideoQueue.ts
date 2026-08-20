import { app, InvocationContext } from "@azure/functions";
import {
  BlobServiceClient,
} from "@azure/storage-blob";
import {
  CosmosClient,
  Container,
} from "@azure/cosmos";
import ffmpegPath from "ffmpeg-static";
import {
  spawn,
} from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

type VideoProcessingJob = {
  type: string;
  videoId: string;
  blobName: string;
  createdAt: string;
};

type VideoEntity = {
  id: string;

  videoId?: string;

  creatorId: string;
  creatorName?: string;

  title?: string;
  publisher?: string;
  producer?: string;
  genre?: string;
  ageRating?: string;
  description?: string;

  blobName?: string;
  blobUrl?: string;
  originalFileName?: string;
  contentType?: string;

  status?: string;

  convertedBlobName?: string;
  convertedBlobUrl?: string;

  transcript?: string;
  transcriptLanguage?: string;

  processingError?: string;

  createdAt?: string;
  processedAt?: string;

  [key: string]: unknown;
};

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `${name} is not configured.`
    );
  }

  return value;
}

function getStorageConnectionString(): string {
  return getEnv(
    "AZURE_STORAGE_CONNECTION_STRING"
  );
}

function getBlobContainerName(): string {
  return (
    process.env.AZURE_BLOB_CONTAINER ||
    "videos"
  );
}

function getCosmosContainer(): Container {
  const endpoint =
    getEnv("COSMOS_ENDPOINT");

  const key =
    getEnv("COSMOS_KEY");

  const database =
    process.env.COSMOS_DATABASE ||
    "MediaNestDB";

  const containerName =
    process.env.COSMOS_VIDEOS_CONTAINER ||
    "Videos";

  const client =
    new CosmosClient({
      endpoint,
      key,
    });

  return client
    .database(database)
    .container(containerName);
}

/*
 * Find a video document by videoId.
 *
 * The Videos container uses /creatorId as its
 * partition key, but the queue message only
 * contains videoId. Therefore this initial lookup
 * is cross-partition.
 */
async function getVideo(
  videoId: string
): Promise<VideoEntity> {
  const container =
    getCosmosContainer();

  const {
    resources,
  } = await container.items
    .query<VideoEntity>({
      query:
        "SELECT TOP 1 * FROM c WHERE c.videoId = @videoId",
      parameters: [
        {
          name: "@videoId",
          value: videoId,
        },
      ],
    })
    .fetchAll();

  const video = resources[0];

  if (!video) {
    throw new Error(
      `Video ${videoId} was not found in Cosmos DB.`
    );
  }

  if (!video.creatorId) {
    throw new Error(
      `Video ${videoId} does not contain a creatorId.`
    );
  }

  return video;
}

/*
 * Update a video document in Cosmos DB.
 *
 * First locate the document to obtain creatorId,
 * then perform a partition-targeted item read/update.
 */
async function updateVideo(
  videoId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const container =
    getCosmosContainer();

  const video =
    await getVideo(videoId);

  const updatedVideo: VideoEntity = {
    ...video,
    ...updates,
  };

  await container
    .item(video.id, video.creatorId)
    .replace(updatedVideo);
}

function runFfmpeg(
  inputPath: string,
  outputPath: string,
  extraArgs: string[] = []
): Promise<void> {
  return new Promise(
    (resolve, reject) => {
      if (!ffmpegPath) {
        reject(
          new Error(
            "FFmpeg binary could not be located."
          )
        );

        return;
      }

      const args = [
        "-y",
        "-i",
        inputPath,
        ...extraArgs,
        outputPath,
      ];

      console.log(
        `Running FFmpeg with output: ${outputPath}`
      );

      console.log(
        `FFmpeg arguments: ${args.join(" ")}`
      );

      const ffmpeg = spawn(
        ffmpegPath,
        args
      );

      let stderr = "";

      ffmpeg.stderr.on(
        "data",
        (data) => {
          stderr += data.toString();
        }
      );

      ffmpeg.on(
        "error",
        reject
      );

      ffmpeg.on(
        "close",
        (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(
              new Error(
                `FFmpeg exited with code ${code}. ${stderr.slice(
                  -3000
                )}`
              )
            );
          }
        }
      );
    }
  );
}

function transcribeAudio(
  audioPath: string
): Promise<string> {
  return new Promise(
    async (resolve, reject) => {
      let recognizer:
        | sdk.SpeechRecognizer
        | undefined;

      try {
        const speechKey =
          getEnv(
            "AZURE_SPEECH_KEY"
          );

        const speechRegion =
          getEnv(
            "AZURE_SPEECH_REGION"
          );

        console.log(
          `Azure AI Speech region: ${speechRegion}`
        );

        console.log(
          `Azure AI Speech key configured: ${
            speechKey.length > 0
          }`
        );

        const audioBuffer =
          await fs.readFile(
            audioPath
          );

        console.log(
          `Speech WAV file size: ${audioBuffer.length} bytes`
        );

        const speechConfig =
          sdk.SpeechConfig.fromSubscription(
            speechKey,
            speechRegion
          );

        speechConfig.speechRecognitionLanguage =
          "en-GB";

        const audioConfig =
          sdk.AudioConfig.fromWavFileInput(
            audioBuffer
          );

        recognizer =
          new sdk.SpeechRecognizer(
            speechConfig,
            audioConfig
          );

        const recognizedParts: string[] =
          [];

        let finished = false;

        const cleanupAndResolve = (
          value: string
        ) => {
          if (finished) {
            return;
          }

          finished = true;

          if (!recognizer) {
            resolve(value);
            return;
          }

          recognizer.stopContinuousRecognitionAsync(
            () => {
              recognizer?.close();

              resolve(value);
            },
            (error) => {
              recognizer?.close();

              console.warn(
                "Speech recognizer stop warning:",
                error
              );

              resolve(value);
            }
          );
        };

        const cleanupAndReject = (
          error: unknown
        ) => {
          if (finished) {
            return;
          }

          finished = true;

          const finalError =
            error instanceof Error
              ? error
              : new Error(
                  String(error)
                );

          if (!recognizer) {
            reject(finalError);
            return;
          }

          recognizer.stopContinuousRecognitionAsync(
            () => {
              recognizer?.close();

              reject(finalError);
            },
            () => {
              recognizer?.close();

              reject(finalError);
            }
          );
        };

        recognizer.recognizing = (
          _sender,
          event
        ) => {
          if (
            event.result.reason ===
            sdk.ResultReason.RecognizingSpeech
          ) {
            const text =
              event.result.text?.trim();

            if (text) {
              console.log(
                `Speech recognizing: ${text}`
              );
            }
          }
        };

        recognizer.recognized = (
          _sender,
          event
        ) => {
          if (
            event.result.reason ===
            sdk.ResultReason.RecognizedSpeech
          ) {
            const text =
              event.result.text?.trim();

            if (text) {
              console.log(
                `Speech recognized: ${text}`
              );

              recognizedParts.push(
                text
              );
            }
          } else if (
            event.result.reason ===
            sdk.ResultReason.NoMatch
          ) {
            console.log(
              "Speech recognition returned NoMatch."
            );
          }
        };

        recognizer.canceled = (
          _sender,
          event
        ) => {
          console.log(
            "========== AZURE SPEECH END/CANCELLATION =========="
          );

          console.log(
            `Speech cancellation reason: ${event.reason}`
          );

          console.log(
            `Speech cancellation error code: ${event.errorCode}`
          );

          console.log(
            `Speech cancellation error details: ${
              event.errorDetails ||
              "None"
            }`
          );

          /*
           * Reason 1 is EndOfStream.
           *
           * This is normal when Azure Speech reaches
           * the end of a WAV file. It is NOT an error.
           */
          if (
            event.reason ===
            sdk.CancellationReason.EndOfStream
          ) {
            console.log(
              "Azure Speech reached the end of the audio stream normally."
            );

            const transcript =
              recognizedParts
                .join(" ")
                .trim();

            console.log(
              `Final transcript characters: ${transcript.length}`
            );

            cleanupAndResolve(
              transcript
            );

            return;
          }

          /*
           * Any other cancellation reason is treated
           * as a real Speech error.
           */
          const detailedMessage =
            event.errorDetails ||
            `Speech recognition was canceled. Reason: ${event.reason}`;

          console.error(
            "========== AZURE SPEECH ERROR =========="
          );

          console.error(
            `Azure Speech detailed error: ${detailedMessage}`
          );

          console.error(
            `Azure Speech reason: ${event.reason}`
          );

          console.error(
            `Azure Speech error code: ${event.errorCode}`
          );

          console.error(
            "========================================"
          );

          cleanupAndReject(
            new Error(
              `Azure Speech cancellation: ${detailedMessage} | Reason: ${event.reason} | ErrorCode: ${event.errorCode}`
            )
          );
        };

        recognizer.sessionStarted =
          () => {
            console.log(
              "Azure AI Speech session started."
            );
          };

        recognizer.sessionStopped =
          () => {
            console.log(
              "Azure AI Speech session stopped."
            );

            const transcript =
              recognizedParts
                .join(" ")
                .trim();

            console.log(
              `Speech transcript collected: ${transcript.length} characters`
            );

            cleanupAndResolve(
              transcript
            );
          };

        recognizer.startContinuousRecognitionAsync(
          () => {
            console.log(
              "Azure AI Speech recognition started."
            );
          },
          (error) => {
            console.error(
              "Azure AI Speech failed to start:",
              error
            );

            cleanupAndReject(error);
          }
        );
      } catch (error) {
        console.error(
          "Azure Speech setup error:",
          error
        );

        reject(
          error instanceof Error
            ? error
            : new Error(
                String(error)
              )
        );
      }
    }
  );
}

async function processVideo(
  job: VideoProcessingJob,
  context: InvocationContext
): Promise<void> {
  context.log(
    "MediaNest video processing started."
  );

  context.log(
    `Processing video ID: ${job.videoId}`
  );

  context.log(
    `Source blob: ${job.blobName}`
  );

  if (
    !job.videoId ||
    !job.blobName
  ) {
    throw new Error(
      "Queue message is missing videoId or blobName."
    );
  }

  const connectionString =
    getStorageConnectionString();

  const blobServiceClient =
    BlobServiceClient.fromConnectionString(
      connectionString
    );

  const container =
    blobServiceClient.getContainerClient(
      getBlobContainerName()
    );

  await container.createIfNotExists();

  const sourceBlob =
    container.getBlockBlobClient(
      job.blobName
    );

  if (
    !(await sourceBlob.exists())
  ) {
    throw new Error(
      `Source video does not exist: ${job.blobName}`
    );
  }

  const temporaryDirectory =
    await fs.mkdtemp(
      path.join(
        os.tmpdir(),
        "medianest-"
      )
    );

  const inputPath =
    path.join(
      temporaryDirectory,
      "input.mp4"
    );

  const outputPath =
    path.join(
      temporaryDirectory,
      "converted.mp4"
    );

  const audioPath =
    path.join(
      temporaryDirectory,
      "audio.wav"
    );

  const convertedBlobName =
    `${job.videoId}-converted.mp4`;

  try {
    await updateVideo(
      job.videoId,
      {
        status: "PROCESSING",
        processingError: "",
      }
    );

    context.log(
      `Downloading ${job.blobName}`
    );

    const inputBuffer =
      await sourceBlob.downloadToBuffer();

    await fs.writeFile(
      inputPath,
      inputBuffer
    );

    context.log(
      "Starting FFmpeg conversion..."
    );

    /*
     * Browser-compatible MP4:
     *
     * Video:
     * - H.264 / AVC
     * - yuv420p pixel format
     * - Main profile
     * - Level 4.0
     *
     * Audio:
     * - AAC
     * - 128 kbps
     *
     * +faststart moves the MP4 metadata to
     * the beginning of the file so browsers
     * can begin playback without downloading
     * the entire file first.
     */
    await runFfmpeg(
      inputPath,
      outputPath,
      [
        "-c:v",
        "libx264",

        "-preset",
        "veryfast",

        "-crf",
        "23",

        "-pix_fmt",
        "yuv420p",

        "-profile:v",
        "main",

        "-level",
        "4.0",

        "-c:a",
        "aac",

        "-b:a",
        "128k",

        "-ar",
        "48000",

        "-movflags",
        "+faststart",
      ]
    );

    context.log(
      "FFmpeg conversion completed."
    );

    const convertedBlob =
      container.getBlockBlobClient(
        convertedBlobName
      );

    const convertedBuffer =
      await fs.readFile(
        outputPath
      );

    await convertedBlob.uploadData(
      convertedBuffer,
      {
        blobHTTPHeaders: {
          blobContentType:
            "video/mp4",
          blobCacheControl:
            "public, max-age=3600",
        },
      }
    );

    context.log(
      "Converted video uploaded successfully."
    );

    /*
     * Verify that the converted blob
     * actually exists after upload.
     */
    const convertedExists =
      await convertedBlob.exists();

    context.log(
      `Converted blob exists: ${convertedExists}`
    );

    if (!convertedExists) {
      throw new Error(
        `Converted video upload verification failed: ${convertedBlobName}`
      );
    }

    context.log(
      "Extracting audio for Azure AI Speech..."
    );

    await runFfmpeg(
      inputPath,
      audioPath,
      [
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-c:a",
        "pcm_s16le",
      ]
    );

    context.log(
      "Audio extraction completed."
    );

    context.log(
      "Starting Azure AI Speech transcription..."
    );

    const transcript =
      await transcribeAudio(
        audioPath
      );

    context.log(
      `Transcription completed. Characters: ${transcript.length}`
    );

    await updateVideo(
      job.videoId,
      {
        status: "PROCESSED",
        convertedBlobName,
        convertedBlobUrl:
          convertedBlob.url,
        transcript,
        transcriptLanguage:
          "en-GB",
        processedAt:
          new Date().toISOString(),
        processingError: "",
      }
    );

    context.log(
      `MediaNest processing completed: ${job.videoId}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown processing error.";

    context.error(
      `Media processing failed: ${errorMessage}`
    );

    try {
      await updateVideo(
        job.videoId,
        {
          status:
            "PROCESSING_FAILED",
          processingError:
            errorMessage.slice(
              0,
              1000
            ),
        }
      );
    } catch (updateError) {
      context.error(
        `Failed to update Cosmos DB processing status: ${
          updateError instanceof Error
            ? updateError.message
            : String(updateError)
        }`
      );
    }

    throw error;
  } finally {
    await fs.rm(
      temporaryDirectory,
      {
        recursive: true,
        force: true,
      }
    );
  }
}

app.storageQueue<VideoProcessingJob>(
  "processVideoQueue",
  {
    queueName:
      "video-processing",
    connection:
      "AzureWebJobsStorage",
    handler:
      processVideo,
  }
);