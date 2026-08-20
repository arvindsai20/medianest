import { CosmosClient, Container } from "@azure/cosmos";

function getCosmosClient(): CosmosClient {
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;

  if (!endpoint) {
    throw new Error("COSMOS_ENDPOINT is not defined.");
  }

  if (!key) {
    throw new Error("COSMOS_KEY is not defined.");
  }

  return new CosmosClient({
    endpoint,
    key,
  });
}

const cosmosClient = getCosmosClient();

const databaseId = process.env.COSMOS_DATABASE || "MediaNestDB";
const videosContainerId =
  process.env.COSMOS_VIDEOS_CONTAINER || "Videos";

export function getVideosContainer(): Container {
  return cosmosClient
    .database(databaseId)
    .container(videosContainerId);
}