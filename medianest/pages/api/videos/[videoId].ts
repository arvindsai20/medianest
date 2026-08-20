import type { NextApiRequest, NextApiResponse } from "next";
import { getVideosContainer } from "../../../lib/azure/cosmos";

type Video = {
  id: string;
  videoId: string;
  creatorId: string;
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

    const container = getVideosContainer();

    const { resources } = await container.items
      .query<Video>({
        query:
          "SELECT TOP 1 * FROM c WHERE c.videoId = @videoId",
        parameters: [
          {
            name: "@videoId",
            value: videoId,
          },
        ],
      })
      .fetchAll();

    const video = resources[0];

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found.",
      });
    }

    return res.status(200).json({
      success: true,
      video,
    });
  } catch (error: unknown) {
    console.error("Fetch video error:", error);

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