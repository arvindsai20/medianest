import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
import { TableClient } from "@azure/data-tables";
import {
  CosmosClient,
  Container,
} from "@azure/cosmos";

type LegacyVideo = {
  partitionKey: string;
  rowKey: string;

  videoId: string;
  creatorId?: string;
  creatorName?: string;

  title: string;
  publisher: string;
  producer: string;
  genre: string;
  ageRating: string;
  description?: string;

  blobName: string;
  blobUrl: string;

  originalFileName?: string;
  contentType?: string;

  status: string;
  createdAt: string;

  convertedBlobName?: string;
  convertedBlobUrl?: string;

  transcript?: string;
  transcriptLanguage?: string;

  processedAt?: string;
  processingError?: string;
};

function getStorageConnectionString(): string {
  const connectionString =
    process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (!connectionString) {
    throw new Error(
      "AZURE_STORAGE_CONNECTION_STRING is not defined."
    );
  }

  return connectionString;
}

function getCosmosClient(): CosmosClient {
  const endpoint =
    process.env.COSMOS_ENDPOINT;

  const key =
    process.env.COSMOS_KEY;

  if (!endpoint) {
    throw new Error(
      "COSMOS_ENDPOINT is not defined."
    );
  }

  if (!key) {
    throw new Error(
      "COSMOS_KEY is not defined."
    );
  }

  return new CosmosClient({
    endpoint,
    key,
  });
}

function getCosmosContainer(): Container {
  const client =
    getCosmosClient();

  const databaseId =
    process.env.COSMOS_DATABASE ||
    "MediaNestDB";

  const containerId =
    process.env.COSMOS_VIDEOS_CONTAINER ||
    "Videos";

  return client
    .database(databaseId)
    .container(containerId);
}

async function migrateVideos() {
  console.log(
    "Starting Videos Table → Cosmos DB migration..."
  );

  const storageConnectionString =
    getStorageConnectionString();

  const tableClient =
    TableClient.fromConnectionString(
      storageConnectionString,
      "Videos",
      {
        allowInsecureConnection: true,
      }
    );

  const cosmosContainer =
    getCosmosContainer();

  let total = 0;
  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for await (
    const entity of tableClient.listEntities<LegacyVideo>()
  ) {
    total++;

    const videoId =
      entity.videoId ||
      entity.rowKey;

    const creatorId =
      entity.creatorId;

    console.log(
      `\nProcessing video: ${videoId}`
    );

    if (!videoId) {
      console.error(
        "  SKIPPED: Missing videoId."
      );

      skipped++;
      continue;
    }

    if (!creatorId) {
      console.error(
        `  SKIPPED: ${videoId} has no creatorId.`
      );

      skipped++;
      continue;
    }

    const cosmosVideo = {
      id: videoId,

      videoId,

      creatorId,

      creatorName:
        entity.creatorName ||
        "Creator",

      title:
        entity.title || "",

      publisher:
        entity.publisher || "",

      producer:
        entity.producer || "",

      genre:
        entity.genre || "",

      ageRating:
        entity.ageRating || "",

      description:
        entity.description || "",

      blobName:
        entity.blobName || "",

      blobUrl:
        entity.blobUrl || "",

      originalFileName:
        entity.originalFileName ||
        entity.blobName ||
        "",

      contentType:
        entity.contentType ||
        "video/mp4",

      status:
        entity.status || "UPLOADED",

      createdAt:
        entity.createdAt ||
        new Date().toISOString(),

      ...(entity.convertedBlobName
        ? {
            convertedBlobName:
              entity.convertedBlobName,
          }
        : {}),

      ...(entity.convertedBlobUrl
        ? {
            convertedBlobUrl:
              entity.convertedBlobUrl,
          }
        : {}),

      ...(entity.transcript
        ? {
            transcript:
              entity.transcript,
          }
        : {}),

      ...(entity.transcriptLanguage
        ? {
            transcriptLanguage:
              entity.transcriptLanguage,
          }
        : {}),

      ...(entity.processedAt
        ? {
            processedAt:
              entity.processedAt,
          }
        : {}),

      ...(entity.processingError
        ? {
            processingError:
              entity.processingError,
          }
        : {}),
    };

    try {
      await cosmosContainer.items.upsert(
        cosmosVideo
      );

      migrated++;

      console.log(
        `  MIGRATED: ${videoId}`
      );
    } catch (error) {
      failed++;

      console.error(
        `  FAILED: ${videoId}`,
        error
      );
    }
  }

  console.log("\n--------------------------------");
  console.log("Migration complete.");
  console.log("--------------------------------");
  console.log(`Total found: ${total}`);
  console.log(`Migrated:    ${migrated}`);
  console.log(`Skipped:     ${skipped}`);
  console.log(`Failed:      ${failed}`);
  console.log("--------------------------------");
}

migrateVideos().catch((error) => {
  console.error(
    "\nMigration failed:",
    error
  );

  process.exit(1);
});