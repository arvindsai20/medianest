import type { NextApiRequest, NextApiResponse } from "next";
import { ensureTable } from "../../lib/azure/tables";
import { STORAGE_CONFIG } from "../../lib/azure/client";

type ResponseData = {
  success: boolean;
  message: string;
  tables?: string[];
  error?: string;
};

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
    const tableNames = [
      STORAGE_CONFIG.usersTable,
      STORAGE_CONFIG.videosTable,
      STORAGE_CONFIG.commentsTable,
      STORAGE_CONFIG.ratingsTable,
    ];

    for (const tableName of tableNames) {
      await ensureTable(tableName);
    }

    return res.status(200).json({
      success: true,
      message: "MediaNest storage tables created successfully.",
      tables: tableNames,
    });
  } catch (error) {
    console.error("Storage setup error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to initialise MediaNest storage.",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });
  }
}