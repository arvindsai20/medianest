import type {
  NextApiRequest,
  NextApiResponse,
} from "next";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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
    const {
      name,
      email,
      password,
      role,
    } = req.body;

    // Validate name
    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    // Validate email
    if (
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // Validate password
    if (
      typeof password !== "string" ||
      password.length < 6
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 6 characters.",
      });
    }

    // Only allow supported roles.
    // Registration defaults to Consumer.
    const userRole =
      role === "CREATOR"
        ? "CREATOR"
        : "CONSUMER";

    const tableClient =
      await ensureTable(
        STORAGE_CONFIG.usersTable
      );

    // Check whether email already exists.
    const existingUsers: UserEntity[] = [];

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
        existingUsers.push(
          entity as UserEntity
        );
      }
    }

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    // Hash password before storing it.
    const passwordHash =
      await bcrypt.hash(password, 12);

    const userId =
      crypto.randomUUID();

    const newUser: UserEntity = {
      partitionKey: "USER",
      rowKey: userId,
      userId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: userRole,
      createdAt:
        new Date().toISOString(),
    };

    await tableClient.createEntity(
      newUser
    );

    return res.status(201).json({
      success: true,
      message:
        "Account created successfully.",
      user: {
        userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error(
      "Registration API error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create account.",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error.",
    });
  }
}