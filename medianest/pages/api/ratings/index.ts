import type { NextApiRequest, NextApiResponse } from "next";
import { ensureTable } from "../../../lib/azure/tables";
import { STORAGE_CONFIG } from "../../../lib/azure/client";

type RatingEntity = {
  partitionKey: string;
  rowKey: string;
  ratingId: string;
  videoId: string;
  userName: string;
  rating: number;
  createdAt: string;
};

type ResponseData = {
  success: boolean;
  ratings?: RatingEntity[];
  rating?: RatingEntity;
  averageRating?: number;
  totalRatings?: number;
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const tableClient = await ensureTable(
      STORAGE_CONFIG.ratingsTable
    );

    // GET /api/ratings?videoId=VIDEO_ID
    if (req.method === "GET") {
      const { videoId } = req.query;

      if (
        typeof videoId !== "string" ||
        !videoId
      ) {
        return res.status(400).json({
          success: false,
          message: "Video ID is required.",
        });
      }

      const ratings: RatingEntity[] = [];

      const entities =
        tableClient.listEntities<RatingEntity>({
          queryOptions: {
            filter: `PartitionKey eq 'VIDEO_${videoId}'`,
          },
        });

      for await (const entity of entities) {
        ratings.push(entity as RatingEntity);
      }

      const totalRatings = ratings.length;

      const averageRating =
        totalRatings > 0
          ? ratings.reduce(
              (sum, item) =>
                sum + Number(item.rating),
              0
            ) / totalRatings
          : 0;

      return res.status(200).json({
        success: true,
        ratings,
        averageRating:
          Math.round(averageRating * 10) / 10,
        totalRatings,
      });
    }

    // POST /api/ratings
    if (req.method === "POST") {
      const {
        videoId,
        userName,
        rating,
      } = req.body;

      if (
        typeof videoId !== "string" ||
        !videoId.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Video ID is required.",
        });
      }

      if (
        typeof userName !== "string" ||
        !userName.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "User name is required.",
        });
      }

      const numericRating = Number(rating);

      if (
        !Number.isInteger(numericRating) ||
        numericRating < 1 ||
        numericRating > 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Rating must be a whole number between 1 and 5.",
        });
      }

      const ratingId = crypto.randomUUID();

      const newRating: RatingEntity = {
        partitionKey: `VIDEO_${videoId}`,
        rowKey: ratingId,
        ratingId,
        videoId,
        userName: userName.trim(),
        rating: numericRating,
        createdAt: new Date().toISOString(),
      };

      await tableClient.createEntity(
        newRating
      );

      return res.status(201).json({
        success: true,
        rating: newRating,
        message: "Rating added successfully.",
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  } catch (error) {
    console.error("Ratings API error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process rating request.",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error.",
    });
  }
}