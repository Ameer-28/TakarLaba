import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/db.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`TakarLaba API running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

const shutdown = (signal: string) => {
  logger.info({ signal }, "Gracefully shutting down...");

  // Force shutdown after 10s timeout
  const forceTimer = setTimeout(() => {
    logger.error("Forceful shutdown: connection draining timed out after 10s");
    process.exit(1);
  }, 10_000);
  forceTimer.unref();

  server.close(async (err) => {
    if (err) {
      logger.error({ err }, "Error closing HTTP server");
    }
    try {
      await prisma.$disconnect();
      logger.info("Database connection closed and HTTP server stopped");
      process.exit(0);
    } catch (dbErr) {
      logger.error({ err: dbErr }, "Error closing database connection");
      process.exit(1);
    }
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
