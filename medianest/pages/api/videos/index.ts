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
  authOptions,
} from "../auth/[...nextauth]";

type Video = {
  partitionKey: string;
  rowKey: string;

  videoId: string;

  creatorId?: string;
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
};

type ResponseData = {
  success: boolean;
  videos?: Video[];
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
    const tableClient =
      await ensureTable(
        STORAGE_CONFIG.videosTable
      );

    const videos: Video[] = [];

    const entities =
      tableClient.listEntities<Video>();

    for await (const entity of entities) {
      videos.push(entity as Video);
    }

    const searchQuery =
      typeof req.query.q === "string"
        ? req.query.q.trim().toLowerCase()
        : "";

    const creatorOnly =
      req.query.creatorOnly === "true";

    let filteredVideos = videos;

    /*
     * Creator management view.
     */
    if (creatorOnly) {
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
        session.user.role !==
        "CREATOR"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only creators can access this view.",
        });
      }

      filteredVideos =
        videos.filter(
          (video) =>
            video.creatorId ===
            session.user.id
        );
    }

    /*
     * Search.
     */
    if (searchQuery) {
      filteredVideos =
        filteredVideos.filter(
          (video) => {
            const searchableText = [
              video.title,
              video.publisher,
              video.producer,
              video.genre,
              video.description,
              video.creatorName,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return searchableText.includes(
              searchQuery
            );
          }
        );
    }

    /*
     * Newest first.
     */
    filteredVideos.sort(
      (a, b) =>
        new Date(
          b.createdAt
        ).getTime() -
        new Date(
          a.createdAt
        ).getTime()
    );

    return res.status(200).json({
      success: true,
      videos: filteredVideos,
    });
  } catch (error) {
    console.error(
      "Fetch videos error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve videos.",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });
  }
}