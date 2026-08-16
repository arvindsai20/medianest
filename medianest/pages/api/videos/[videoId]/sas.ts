import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import {
  generateVideoSasUrl,
} from "../../../../lib/azure/sas";

import {
  ensureTable,
} from "../../../../lib/azure/tables";

import {
  STORAGE_CONFIG,
} from "../../../../lib/azure/client";

type VideoEntity = {
  partitionKey: string;
  rowKey: string;
  videoId?: string;
  blobName?: string;
  convertedBlobName?: string;
  status?: string;
  title?: string;
};

type ResponseData = {
  success: boolean;
  videoUrl?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed.",
    });
  }

  const { videoId } = req.query;

  if (typeof videoId !== "string") {
    return res.status(400).json({
      success: false,
      error: "Invalid video ID.",
    });
  }

  try {
    const tableClient = await ensureTable(
      STORAGE_CONFIG.videosTable
    );

    const video =
      await tableClient.getEntity<VideoEntity>(
        "VIDEO",
        videoId
      );

    /*
     * For processed videos, always use the
     * FFmpeg-converted MP4.
     *
     * The converted file is encoded as:
     * H.264 video + AAC audio
     * with +faststart enabled.
     *
     * This is the browser-friendly version.
     */
    const playbackBlobName =
      video.status === "PROCESSED" &&
      video.convertedBlobName
        ? video.convertedBlobName
        : video.blobName;

    if (!playbackBlobName) {
      return res.status(404).json({
        success: false,
        error: "Video file was not found.",
      });
    }

    const videoUrl =
      generateVideoSasUrl(
        playbackBlobName
      );

    return res.status(200).json({
      success: true,
      videoUrl,
    });
  } catch (error) {
    console.error(
      "Video SAS URL error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate video URL.",
    });
  }
}