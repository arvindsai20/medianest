import {
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

const connectionString =
  process.env.AZURE_STORAGE_CONNECTION_STRING;

if (!connectionString) {
  throw new Error(
    "AZURE_STORAGE_CONNECTION_STRING is not defined."
  );
}

function getConnectionStringValue(
  name: string
): string {
  const match = connectionString.match(
    new RegExp(`${name}=([^;]+)`)
  );

  if (!match) {
    throw new Error(
      `${name} is missing from AZURE_STORAGE_CONNECTION_STRING.`
    );
  }

  return match[1];
}

const accountName =
  getConnectionStringValue("AccountName");

const accountKey =
  getConnectionStringValue("AccountKey");

const blobEndpoint =
  getConnectionStringValue("BlobEndpoint");

const credential =
  new StorageSharedKeyCredential(
    accountName,
    accountKey
  );

export function generateVideoSasUrl(
  blobName: string
): string {
  const containerName =
    process.env.AZURE_BLOB_CONTAINER || "videos";

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