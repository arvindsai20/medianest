import { TableServiceClient } from "@azure/data-tables";
import { BlobServiceClient } from "@azure/storage-blob";
import { QueueServiceClient } from "@azure/storage-queue";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

if (!connectionString) {
  throw new Error("AZURE_STORAGE_CONNECTION_STRING is not defined.");
}

export const tableServiceClient =
  TableServiceClient.fromConnectionString(connectionString);

export const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);

export const queueServiceClient =
  QueueServiceClient.fromConnectionString(connectionString);

export const STORAGE_CONFIG = {
  blobContainer:
    process.env.AZURE_BLOB_CONTAINER || "videos",

  usersTable:
    process.env.AZURE_USERS_TABLE || "Users",

  videosTable:
    process.env.AZURE_VIDEOS_TABLE || "Videos",

  commentsTable:
    process.env.AZURE_COMMENTS_TABLE || "Comments",

  ratingsTable:
    process.env.AZURE_RATINGS_TABLE || "Ratings",

  videoQueue:
    process.env.AZURE_VIDEO_QUEUE || "video-processing",
};