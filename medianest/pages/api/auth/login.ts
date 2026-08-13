import type {
  NextApiRequest,
  NextApiResponse,
} from "next";
import bcrypt from "bcryptjs";

import {
  ensureTable,
} from "../../../lib/azure/tables";

import {
  STORAGE_CONFIG,
} from "../../../lib/azure/client";

type UserEntity = {
  partitionKey: string;
  rowKey: string;
  userId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "CONSUMER" | "CREATOR";
  createdAt: string;
};

type ResponseData = {
  success: boolean;
  message?: string;
  user?: {
    userId: string;
    name: string;
    email: string;
    role: "CONSUMER" | "CREATOR";
  };
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  }

  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const tableClient =
      await ensureTable(
        STORAGE_CONFIG.usersTable
      );

    let foundUser: UserEntity | null = null;

    const entities =
      tableClient.listEntities<UserEntity>({
        queryOptions: {
          filter: `PartitionKey eq 'USER'`,
        },
      });

    for await (const entity of entities) {
      if (
        entity.email?.toLowerCase() ===
        normalizedEmail
      ) {
        foundUser =
          entity as UserEntity;
        break;
      }
    }

    if (!foundUser) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        foundUser.passwordHash
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: {
        userId: foundUser.userId,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
      },
    });
  } catch (error) {
    console.error(
      "Login API error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to process login.",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error.",
    });
  }
}