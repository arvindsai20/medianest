import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { ensureTable } from "../../../lib/azure/tables";
import { STORAGE_CONFIG } from "../../../lib/azure/client";
import { authOptions } from "../auth/[...nextauth]";

type LikeEntity = {
  partitionKey: string;
  rowKey: string;
  likeId: string;
  videoId: string;
  userId: string;
  userName: string;
  createdAt: string;
};

type ResponseData = {
  success: boolean;
  liked?: boolean;
  like?: LikeEntity;
  totalLikes?: number;
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const session = await getServerSession(
      req,
      res,
      authOptions
    );

    const tableClient = await ensureTable(
      STORAGE_CONFIG.likesTable
    );

    // GET /api/likes?videoId=VIDEO_ID
    if (req.method === "GET") {
      const { videoId } = req.query;

      if (
        typeof videoId !== "string" ||
        !videoId.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Video ID is required.",
        });
      }

      const likes: LikeEntity[] = [];

      const entities =
        tableClient.listEntities<LikeEntity>({
          queryOptions: {
            filter: `PartitionKey eq 'VIDEO_${videoId}'`,
          },
        });

      for await (const entity of entities) {
        likes.push(entity as LikeEntity);
      }

      const totalLikes = likes.length;

      let liked = false;

      if (session?.user?.id) {
        liked = likes.some(
          (like) => like.userId === session.user.id
        );
      }

      return res.status(200).json({
        success: true,
        liked,
        totalLikes,
      });
    }

    // POST /api/likes
    if (req.method === "POST") {
      if (!session?.user?.id) {
        return res.status(401).json({
          success: false,
          message:
            "You must be logged in to like a video.",
        });
      }

      const { videoId } = req.body;

      if (
        typeof videoId !== "string" ||
        !videoId.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Video ID is required.",
        });
      }

      const userId = session.user.id;
      const userName =
        session.user.name ||
        session.user.email ||
        "User";

      const partitionKey = `VIDEO_${videoId}`;
      const rowKey = `USER_${userId}`;

      // Prevent duplicate likes
      try {
        await tableClient.getEntity<LikeEntity>(
          partitionKey,
          rowKey
        );

        return res.status(409).json({
          success: false,
          message:
            "You have already liked this video.",
        });
      } catch (error: any) {
        if (error?.statusCode !== 404) {
          throw error;
        }
      }

      const likeId = crypto.randomUUID();

      const newLike: LikeEntity = {
        partitionKey,
        rowKey,
        likeId,
        videoId,
        userId,
        userName,
        createdAt: new Date().toISOString(),
      };

      await tableClient.createEntity(newLike);

      return res.status(201).json({
        success: true,
        liked: true,
        like: newLike,
        message: "Video liked successfully.",
      });
    }

    // DELETE /api/likes?videoId=VIDEO_ID
    if (req.method === "DELETE") {
      if (!session?.user?.id) {
        return res.status(401).json({
          success: false,
          message:
            "You must be logged in to unlike a video.",
        });
      }

      const { videoId } = req.query;

      if (
        typeof videoId !== "string" ||
        !videoId.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Video ID is required.",
        });
      }

      const partitionKey = `VIDEO_${videoId}`;
      const rowKey = `USER_${session.user.id}`;

      try {
        await tableClient.deleteEntity(
          partitionKey,
          rowKey
        );
      } catch (error: any) {
        if (error?.statusCode !== 404) {
          throw error;
        }
      }

      return res.status(200).json({
        success: true,
        liked: false,
        message: "Video unliked successfully.",
      });
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);

    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  } catch (error) {
    console.error("Likes API error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process like request.",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error.",
    });
  }
}