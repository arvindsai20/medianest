import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import formidable, {
  File,
} from "formidable";

import fs from "fs";

import { getServerSession } from "next-auth";

import {
  uploadVideo,
} from "../../../lib/azure/blobs";

import {
  addVideoProcessingJob,
} from "../../../lib/azure/queue";

import {
  getVideosContainer,
} from "../../../lib/azure/cosmos";

import {
  authOptions,
} from "../auth/[...nextauth]";

export const config = {
  api: {
    bodyParser: false,
  },
};

type ResponseData = {
  success: boolean;
  message: string;
  video?: any;
  error?: string;
};

function parseForm(
  req: NextApiRequest
): Promise<{
  fields: formidable.Fields;
  files: formidable.Files;
}> {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
  });

  return new Promise(
    (resolve, reject) => {
      form.parse(
        req,
        (error, fields, files) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              fields,
              files,
            });
          }
        }
      );
    }
  );
}

function getField(
  value:
    | string
    | string[]
    | undefined
): string {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function getUploadedFile(
  file:
    | File
    | File[]
    | undefined
): File | null {
  if (Array.isArray(file)) {
    return file[0] || null;
  }

  return file || null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const session =
      await getServerSession(
        req,
        res,
        authOptions
      );

    if (!session?.user) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in.",
      });
    }

    if (
      session.user.role !== "CREATOR"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only creator accounts can upload videos.",
      });
    }

    const {
      fields,
      files,
    } = await parseForm(req);

    const title = getField(
      fields.title
    );

    const publisher = getField(
      fields.publisher
    );

    const producer = getField(
      fields.producer
    );

    const genre = getField(
      fields.genre
    );

    const ageRating = getField(
      fields.ageRating
    );

    const description = getField(
      fields.description
    );

    const videoFile =
      getUploadedFile(files.file);

    if (!videoFile) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a video file.",
      });
    }

    if (
      !title ||
      !publisher ||
      !producer ||
      !genre ||
      !ageRating
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, Publisher, Producer, Genre and Age Rating are required.",
      });
    }

    const videoId =
      crypto.randomUUID();

    const extension =
      videoFile.originalFilename
        ?.split(".")
        .pop()
        ?.toLowerCase() || "mp4";

    const blobName =
      `${videoId}.${extension}`;

    const fileBuffer =
      fs.readFileSync(
        videoFile.filepath
      );

    /*
     * Upload the actual video file
     * to Azure Blob Storage.
     */
    const blobUrl =
      await uploadVideo(
        blobName,
        fileBuffer,
        videoFile.mimetype ||
          "video/mp4"
      );

    /*
     * Video metadata is now stored in
     * Azure Cosmos DB.
     *
     * The Videos container uses /creatorId
     * as its partition key.
     */
    const videoEntity = {
      id: videoId,

      videoId,

      creatorId: session.user.id,

      creatorName:
        session.user.name ||
        "Creator",

      title,

      publisher,

      producer,

      genre,

      ageRating,

      description,

      blobName,

      blobUrl,

      originalFileName:
        videoFile.originalFilename ||
        blobName,

      contentType:
        videoFile.mimetype ||
        "video/mp4",

      status: "UPLOADED",

      createdAt:
        new Date().toISOString(),
    };

    const container =
      getVideosContainer();

    await container.items.create(
      videoEntity
    );

    /*
     * Queue the video for asynchronous
     * FFmpeg conversion and speech
     * recognition.
     */
    await addVideoProcessingJob(
      videoId,
      blobName
    );

    return res.status(201).json({
      success: true,
      message:
        "Video uploaded successfully.",
      video: videoEntity,
    });
  } catch (error) {
    console.error(
      "Video upload error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to upload video.",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });
  }
}