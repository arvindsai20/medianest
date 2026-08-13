import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import { getServerSession } from "next-auth";

import {
  ensureTable,
} from "../../../lib/azure/tables";

import {
  STORAGE_CONFIG,
} from "../../../lib/azure/client";

import {
  deleteVideo,
} from "../../../lib/azure/blobs";

import {
  authOptions,
} from "../auth/[...nextauth]";

type ResponseData = {
  success: boolean;
  message: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const session =
      await getServerSession(
        req,
        res,
        authOptions
      );

    if (!session?.user) {
      return res.status(401).json({
        success: false,
        message:
          "You must be logged in.",
      });
    }

    if (
      session.user.role !== "CREATOR"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only creators can delete videos.",
      });
    }

    const {
      videoId,
    } = req.body;

    if (
      typeof videoId !== "string" ||
      !videoId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Video ID is required.",
      });
    }

    const tableClient =
      await ensureTable(
        STORAGE_CONFIG.videosTable
      );

    let video: any;

    try {
      video =
        await tableClient.getEntity(
          "VIDEO",
          videoId
        );
    } catch (error: any) {
      if (error?.statusCode === 404) {
        return res.status(404).json({
          success: false,
          message:
            "Video not found.",
        });
      }

      throw error;
    }

    /*
     * Ownership check.
     */
    if (
      video.creatorId !==
      session.user.id
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only manage your own videos.",
      });
    }

    /*
     * Delete the video from
     * Azure Blob Storage.
     */
    if (video.blobName) {
      await deleteVideo(
        video.blobName
      );
    }

    /*
     * Delete metadata from
     * Azure Table Storage.
     */
    await tableClient.deleteEntity(
      "VIDEO",
      videoId
    );

    return res.status(200).json({
      success: true,
      message:
        "Video deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete video error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete video.",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });
  }
}