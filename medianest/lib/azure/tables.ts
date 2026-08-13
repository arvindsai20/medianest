import {
  TableClient,
  TableEntity,
} from "@azure/data-tables";

import {
  getTableServiceClient,
  STORAGE_CONFIG,
} from "./client";

export async function createStorageTables() {
  const tableServiceClient =
    getTableServiceClient();

  const tableNames = [
    STORAGE_CONFIG.usersTable,
    STORAGE_CONFIG.videosTable,
    STORAGE_CONFIG.commentsTable,
    STORAGE_CONFIG.ratingsTable,
  ];

  for (const tableName of tableNames) {
    try {
      await tableServiceClient.createTable(
        tableName
      );
    } catch (error: any) {
      if (error?.statusCode !== 409) {
        throw error;
      }
    }
  }

  return tableNames;
}

export function getTableClient(
  tableName: string
) {
  const connectionString =
    process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (!connectionString) {
    throw new Error(
      "AZURE_STORAGE_CONNECTION_STRING is not defined."
    );
  }

  return TableClient.fromConnectionString(
    connectionString,
    tableName,
    {
      allowInsecureConnection: true,
    }
  );
}

export async function ensureTable(
  tableName: string
) {
  const client =
    getTableClient(tableName);

  try {
    await client.createTable();
  } catch (error: any) {
    if (error?.statusCode !== 409) {
      throw error;
    }
  }

  return client;
}

export async function insertEntity<
  T extends Record<string, any>
>(
  tableName: string,
  entity: TableEntity<T>
) {
  const client =
    await ensureTable(tableName);

  await client.createEntity(entity);

  return entity;
}

export async function upsertEntity<
  T extends Record<string, any>
>(
  tableName: string,
  entity: TableEntity<T>
) {
  const client =
    await ensureTable(tableName);

  await client.upsertEntity(
    entity,
    "Merge"
  );

  return entity;
}