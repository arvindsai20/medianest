import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import { getServerSession } from "next-auth";

import { getVideosContainer } from "../../../lib/azure/cosmos";

import {
  authOptions,
} from "../auth/[...nextauth]";

type Video = {
  id: string;

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

type PublicVideo = {
  videoId: string;

  creatorName?: string;

  title: string;
  publisher: string;
  producer: string;
  genre: string;
  ageRating: string;

  description?: string;

  status: string;

  createdAt: string;
};

type ResponseData = {
  success: boolean;
  videos?: Array<Video | PublicVideo>;
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
    const container = getVideosContainer();

    const searchQuery =
      typeof req.query.q === "string"
        ? req.query.q.trim().toLowerCase()
        : "";

    const creatorOnly =
      req.query.creatorOnly === "true";

    /*
     * Creator management view.
     *
     * Authentication and role-based access
     * control are required.
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
          message: "You must be logged in.",
        });
      }

      if (
        session.user.role !== "CREATOR"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only creators can access this view.",
        });
      }

      /*
       * Cosmos DB uses creatorId as the partition key.
       * Querying by creatorId keeps the creator
       * management query within the correct partition.
       */
      const querySpec = {
        query:
          "SELECT * FROM c WHERE c.creatorId = @creatorId",
        parameters: [
          {
            name: "@creatorId",
            value: session.user.id,
          },
        ],
      };

      const { resources } =
        await container.items
          .query<Video>(querySpec)
          .fetchAll();

      let filteredVideos = resources;

      /*
       * Search within the creator's own videos.
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

      /*
       * Creator-only response can contain
       * the creator's own management data.
       */
      return res.status(200).json({
        success: true,
        videos: filteredVideos,
      });
    }

    /*
     * Public consumer feed/search.
     *
     * Only processed videos are exposed.
     */
    const { resources } =
      await container.items
        .query<Video>({
          query:
            "SELECT * FROM c WHERE c.status = @status",
          parameters: [
            {
              name: "@status",
              value: "PROCESSED",
            },
          ],
        })
        .fetchAll();

    let filteredVideos = resources;

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

    /*
     * IMPORTANT:
     *
     * Never expose Azure Blob URLs, blob names,
     * creator IDs, original filenames, processing
     * errors, transcripts or other internal storage
     * information through the public API.
     *
     * Secure playback URLs are generated separately
     * by /api/videos/[videoId]/sas.
     */
    const publicVideos: PublicVideo[] =
      filteredVideos.map(
        (video) => ({
          videoId:
            video.videoId,

          creatorName:
            video.creatorName,

          title:
            video.title,

          publisher:
            video.publisher,

          producer:
            video.producer,

          genre:
            video.genre,

          ageRating:
            video.ageRating,

          description:
            video.description,

          status:
            video.status,

          createdAt:
            video.createdAt,
        })
      );

    return res.status(200).json({
      success: true,
      videos: publicVideos,
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