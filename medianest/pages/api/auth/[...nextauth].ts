import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { ensureTable } from "../../../lib/azure/tables";
import { STORAGE_CONFIG } from "../../../lib/azure/client";

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

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "MediaNest Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (
          !credentials?.email ||
          !credentials?.password
        ) {
          return null;
        }

        const normalizedEmail =
          credentials.email
            .trim()
            .toLowerCase();

        const tableClient = await ensureTable(
          STORAGE_CONFIG.usersTable
        );

        let foundUser: UserEntity | null = null;

        const entities =
          tableClient.listEntities<UserEntity>({
            queryOptions: {
              filter: "PartitionKey eq 'USER'",
            },
          });

        for await (const entity of entities) {
          if (
            entity.email?.toLowerCase() ===
            normalizedEmail
          ) {
            foundUser = entity as UserEntity;
            break;
          }
        }

        if (!foundUser) {
          return null;
        }

        const passwordMatches =
          await bcrypt.compare(
            credentials.password,
            foundUser.passwordHash
          );

        if (!passwordMatches) {
          return null;
        }

        return {
          id: foundUser.userId,
          name: foundUser.name,
          email: foundUser.email,
          role: foundUser.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          token.id as string;

        session.user.role =
          token.role as
            | "CONSUMER"
            | "CREATOR";
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug:
    process.env.NODE_ENV ===
    "development",
};

export default NextAuth(authOptions);