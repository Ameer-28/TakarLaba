import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db.js";
import { env } from "../config/env.js";

const trustedOrigins = Array.from(
  new Set([
    env.FRONTEND_URL,
    ...(env.NODE_ENV === "development"
      ? [
          "http://localhost:5173",
          "http://localhost:4000",
          "http://127.0.0.1:5173",
          "http://127.0.0.1:4000",
        ]
      : []),
  ])
);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "OWNER",
        input: false,
      },
      businessId: {
        type: "string",
        required: false,
        input: false,
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 10,
      },
      "/sign-up/email": {
        window: 60,
        max: 5,
      },
    },
  },
  advanced: {
    useSecureCookies: env.NODE_ENV === "production",
  },
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
