import NextAuth from "next";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "CONSUMER" | "CREATOR";
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role: "CONSUMER" | "CREATOR";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "CONSUMER" | "CREATOR";
  }
}