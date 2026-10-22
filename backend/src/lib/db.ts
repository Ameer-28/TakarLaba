import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "../config/env.js";

/**
 * Serverless-friendly PostgreSQL connection pool.
 * - max: 5 connections per container to prevent exhausting DB pooler connections.
 * - idleTimeoutMillis: 10_000 (10s) to reclaim idle connections quickly in ephemeral instances.
 * - connectionTimeoutMillis: 5_000 (5s) to fail fast when database is unreachable.
 * - No setInterval/background ping tasks so Node process can cleanly idle/freeze in serverless.
 */
export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  // Prevent unhandled error crash when remote Neon pooler resets idle socket
  console.warn("Peringatan koneksi idle database di-reset:", err.message);
});

export const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

export async function checkPrismaConnection(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}
