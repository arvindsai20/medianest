import type { NextApiRequest, NextApiResponse } from "next";
import { ensureTable } from "../../../lib/azure/tables";
import { STORAGE_CONFIG } from "../../../lib/azure/client";

type Video = {
  partitionKey: string;
  rowKey: string;
  videoId: string;
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
};

type ResponseData = {
  success: boolean;
  video?: Video;
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const videoId = req.query.videoId;

    if (typeof videoId !== "string" || !videoId) {
      return res.status(400).json({
        success: false,
        message: "Video ID is required.",
      });
    }

    const tableClient = await ensureTable(
      STORAGE_CONFIG.videosTable
    );

    const video = await tableClient.getEntity<Video>(
      "VIDEO",
      videoId
    );

    return res.status(200).json({
      success: true,
      video: video as Video,
    });
  } catch (error: any) {
    console.error("Fetch video error:", error);

    if (error?.statusCode === 404) {
      return res.status(404).json({
        success: false,
        message: "Video not found.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve video.",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });
  }
}