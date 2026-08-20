import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import { getServerSession } from "next-auth";

import {
  getVideosContainer,
} from "../../../lib/azure/cosmos";

import {
  authOptions,
} from "../auth/[...nextauth]";

type ResponseData = {
  success: boolean;
  message: string;
  video?: any;
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
  if (req.method !== "PUT") {
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
          "Only creators can edit videos.",
      });
    }

    const {
      videoId,
      title,
      publisher,
      producer,
      genre,
      ageRating,
      description,
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

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title is required.",
      });
    }

    if (
      typeof publisher !== "string" ||
      !publisher.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Publisher is required.",
      });
    }

    if (
      typeof producer !== "string" ||
      !producer.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Producer is required.",
      });
    }

    if (
      typeof genre !== "string" ||
      !genre.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Genre is required.",
      });
    }

    if (
      typeof ageRating !== "string" ||
      !ageRating.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Age Rating is required.",
      });
    }

    const container =
      getVideosContainer();

    /*
     * Find the video by videoId.
     *
     * The Cosmos container is partitioned by
     * creatorId, so the creator ID is obtained
     * from the authenticated user's session.
     *
     * This prevents a creator from updating
     * another creator's video.
     */
    let video: Video;

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
     * This is retained even though the
     * partition-key read already targets
     * the authenticated creator's partition.
     */
    if (
      video.creatorId !==
      session.user.id
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only edit your own videos.",
      });
    }

    const updatedVideo: Video = {
      ...video,

      title:
        title.trim(),

      publisher:
        publisher.trim(),

      producer:
        producer.trim(),

      genre:
        genre.trim(),

      ageRating:
        ageRating.trim(),

      description:
        typeof description === "string"
          ? description.trim()
          : "",

      updatedAt:
        new Date().toISOString(),
    };

    await container
      .item(
        videoId,
        session.user.id
      )
      .replace(updatedVideo);

    return res.status(200).json({
      success: true,
      message:
        "Video updated successfully.",
      video: updatedVideo,
    });
  } catch (error) {
    console.error(
      "Update video error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update video.",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });
  }
}