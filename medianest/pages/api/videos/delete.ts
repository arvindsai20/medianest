import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import { getServerSession } from "next-auth";

import {
  getVideosContainer,
} from "../../../lib/azure/cosmos";

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

  convertedBlobName?: string;
  convertedBlobUrl?: string;

  originalFileName?: string;
  contentType?: string;

  status: string;

  createdAt: string;
  processedAt?: string;
  processingError?: string;
  transcript?: string;
  transcriptLanguage?: string;

  updatedAt?: string;
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

    const container =
      getVideosContainer();

    let video: Video;

    /*
     * Read the video from the authenticated
     * creator's Cosmos DB partition.
     */
    try {
      const {
        resource,
      } = await container
        .item(
          videoId,
          session.user.id
        )
        .read<Video>();

      if (!resource) {
        return res.status(404).json({
          success: false,
          message:
            "Video not found.",
        });
      }

      video = resource;
    } catch (error: any) {
      if (
        error?.code === 404 ||
        error?.statusCode === 404
      ) {
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
     *
     * The partition-key read already targets
     * the authenticated creator, but this
     * explicit check provides an additional
     * authorization safeguard.
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
     * Delete the original video from
     * Azure Blob Storage.
     */
    if (video.blobName) {
      await deleteVideo(
        video.blobName
      );
    }

    /*
     * Delete the converted video as well
     * when a processed version exists.
     */
    if (
      video.convertedBlobName &&
      video.convertedBlobName !==
        video.blobName
    ) {
      await deleteVideo(
        video.convertedBlobName
      );
    }

    /*
     * Delete video metadata from
     * Azure Cosmos DB.
     */
    await container
      .item(
        videoId,
        session.user.id
      )
      .delete();

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