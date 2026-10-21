import "./src/config/load-env.js";
import { defineConfig, env } from "prisma/config";

// Resolve DIRECT_URL from DATABASE_URL_UNPOOLED if DIRECT_URL is unset; never fallback to DATABASE_URL (pooled)
// See backend/src/config/load-env.ts for centralized environment loading.
if (!process.env.DIRECT_URL && process.env.DATABASE_URL_UNPOOLED) {
  process.env.DIRECT_URL = process.env.DATABASE_URL_UNPOOLED;
}

export default defineConfig({
  schema: "../database/schema.prisma",
  migrations: { path: "../database/migrations", seed: "tsx src/seed/index.ts" },
  datasource: { url: env("DIRECT_URL") },
});
