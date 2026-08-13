import {
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

function getConnectionString(): string {
  const connectionString =
    process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (!connectionString) {
    throw new Error(
      "AZURE_STORAGE_CONNECTION_STRING is not defined."
    );
  }

  return connectionString;
}

function getConnectionStringValue(
  connectionStringValue: string,
  name: string
): string {
  const match =
    connectionStringValue.match(
      new RegExp(`${name}=([^;]+)`)
    );

  if (!match?.[1]) {
    throw new Error(
      `${name} is missing from AZURE_STORAGE_CONNECTION_STRING.`
    );
  }

  return match[1];
}

export function generateVideoSasUrl(
  blobName: string
): string {
  const connectionString =
    getConnectionString();

  const accountName =
    getConnectionStringValue(
      connectionString,
      "AccountName"
    );

  const accountKey =
    getConnectionStringValue(
      connectionString,
      "AccountKey"
    );

  const blobEndpoint =
    getConnectionStringValue(
      connectionString,
      "BlobEndpoint"
    );

  const credential =
    new StorageSharedKeyCredential(
      accountName,
      accountKey
    );

  const containerName =
    process.env.AZURE_BLOB_CONTAINER ||
    "videos";

  // Allow a small clock difference between
  // the browser, Next.js and Azurite.
  const startsOn = new Date(
    Date.now() - 5 * 60 * 1000
  );

  // SAS remains valid for one hour.
  const expiresOn = new Date(
    Date.now() + 60 * 60 * 1000
  );

  const sasToken =
    generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions:
          BlobSASPermissions.parse("r"),
        startsOn,
        expiresOn,
      },
      credential
    ).toString();

  return `${blobEndpoint}/${containerName}/${encodeURIComponent(
    blobName
  )}?${sasToken}`;
}