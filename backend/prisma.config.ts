import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load root .env.local or local .env
const rootEnvLocal = path.resolve(process.cwd(), "../.env.local");
if (fs.existsSync(rootEnvLocal)) {
  dotenv.config({ path: rootEnvLocal });
}
dotenv.config();

// Set DIRECT_URL from DATABASE_URL_UNPOOLED or DATABASE_URL if not explicitly set
process.env.DIRECT_URL =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  "";

export default defineConfig({
  schema: "../database/schema.prisma",
  migrations: { path: "../database/migrations", seed: "tsx src/seed/index.ts" },
  datasource: { url: env("DIRECT_URL") },
});
