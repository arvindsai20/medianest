import type { NextApiRequest, NextApiResponse } from "next";
import { ensureTable } from "../../../lib/azure/tables";
import { STORAGE_CONFIG } from "../../../lib/azure/client";

type CommentEntity = {
  partitionKey: string;
  rowKey: string;
  commentId: string;
  videoId: string;
  userName: string;
  comment: string;
  createdAt: string;
};

type ResponseData = {
  success: boolean;
  comments?: CommentEntity[];
  comment?: CommentEntity;
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const tableClient = await ensureTable(
      STORAGE_CONFIG.commentsTable
    );

    // GET /api/comments?videoId=VIDEO_ID
    if (req.method === "GET") {
      const { videoId } = req.query;

      if (typeof videoId !== "string" || !videoId) {
        return res.status(400).json({
          success: false,
          message: "Video ID is required.",
        });
      }

      const comments: CommentEntity[] = [];

      const entities = tableClient.listEntities<CommentEntity>({
        queryOptions: {
          filter: `PartitionKey eq 'VIDEO_${videoId}'`,
        },
      });

      for await (const entity of entities) {
        comments.push(entity as CommentEntity);
      }

      comments.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
        );
      });

      return res.status(200).json({
        success: true,
        comments,
      });
    }

    // POST /api/comments
    if (req.method === "POST") {
      const {
        videoId,
        userName,
        comment,
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

      if (
        typeof comment !== "string" ||
        !comment.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Comment cannot be empty.",
        });
      }

      if (comment.trim().length > 500) {
        return res.status(400).json({
          success: false,
          message:
            "Comment cannot be longer than 500 characters.",
        });
      }

      const commentId = crypto.randomUUID();

      const newComment: CommentEntity = {
        partitionKey: `VIDEO_${videoId}`,
        rowKey: commentId,
        commentId,
        videoId,
        userName: userName.trim(),
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      };

      await tableClient.createEntity(newComment);

      return res.status(201).json({
        success: true,
        comment: newComment,
        message: "Comment added successfully.",
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  } catch (error) {
    console.error("Comments API error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process comment request.",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error.",
    });
  }
}