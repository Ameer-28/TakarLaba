import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

// Check if parent .env.local or root .env exists
const rootEnvLocal = path.resolve(process.cwd(), "../.env.local");
if (fs.existsSync(rootEnvLocal)) {
  dotenv.config({ path: rootEnvLocal });
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional(),
  DATABASE_URL_UNPOOLED: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().default("development-fallback-secret-min-32-chars-long"),
  BETTER_AUTH_URL: z.string().default("http://localhost:5173"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  DEMO_MODE: z.coerce.boolean().default(true),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:", parsed.error.issues);
  throw new Error("Invalid environment configuration. Check logs above.");
}

export const env = {
  ...parsed.data,
  DIRECT_URL: parsed.data.DIRECT_URL || parsed.data.DATABASE_URL_UNPOOLED || parsed.data.DATABASE_URL,
};
