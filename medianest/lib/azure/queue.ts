import {
  queueServiceClient,
  STORAGE_CONFIG,
} from "./client";

export async function getVideoQueue() {
  const queueClient =
    queueServiceClient.getQueueClient(
      STORAGE_CONFIG.videoQueue
    );

  await queueClient.createIfNotExists();

  return queueClient;
}

export async function addVideoProcessingJob(
  videoId: string,
  blobName: string
) {
  const queueClient =
    await getVideoQueue();

  const job = {
    type: "VIDEO_PROCESSING",
    videoId,
    blobName,
    createdAt: new Date().toISOString(),
  };

  await queueClient.sendMessage(
    JSON.stringify(job)
  );

  return job;
}