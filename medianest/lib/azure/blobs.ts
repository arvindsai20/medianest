import {
  ContainerClient,
} from "@azure/storage-blob";

import {
  blobServiceClient,
  STORAGE_CONFIG,
} from "./client";

export async function getVideoContainer(): Promise<ContainerClient> {
  const container =
    blobServiceClient.getContainerClient(
      STORAGE_CONFIG.blobContainer
    );

  await container.createIfNotExists({
    access: undefined,
  });

  return container;
}

export async function uploadVideo(
  blobName: string,
  data: Buffer,
  contentType: string
) {
  const container = await getVideoContainer();

  const blockBlobClient =
    container.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(data, {
    blobHTTPHeaders: {
      blobContentType: contentType,
    },
  });

  return blockBlobClient.url;
}

export async function deleteVideo(blobName: string) {
  const container = await getVideoContainer();

  const blockBlobClient =
    container.getBlockBlobClient(blobName);

  await blockBlobClient.deleteIfExists();
}

export async function videoExists(blobName: string) {
  const container = await getVideoContainer();

  const blockBlobClient =
    container.getBlockBlobClient(blobName);

  return blockBlobClient.exists();
}