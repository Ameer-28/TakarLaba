import "./src/config/load-env.js";
import { defineConfig, env } from "prisma/config";

// Resolve DIRECT_URL from DATABASE_URL_UNPOOLED if DIRECT_URL is unset; never fallback to DATABASE_URL (pooled)
// See backend/src/config/load-env.ts for centralized environment loading.
if (!process.env.DIRECT_URL && process.env.DATABASE_URL_UNPOOLED) {
  process.env.DIRECT_URL = process.env.DATABASE_URL_UNPOOLED;
}

if (!process.env.DIRECT_URL) {
  // Safe dummy fallback for build/CI when only generating client without database connection
  process.env.DIRECT_URL =
    process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy?sslmode=disable";
}

export default defineConfig({
  schema: "../database/schema.prisma",
  migrations: { path: "../database/migrations", seed: "tsx src/seed/index.ts" },
  datasource: { url: env("DIRECT_URL") },
});
