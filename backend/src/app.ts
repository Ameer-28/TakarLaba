import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { logger } from "./lib/logger.js";
import { sendSuccess } from "./lib/envelope.js";
import { checkPrismaConnection } from "./lib/db.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

export function createApp() {
  const app = express();

  // Security headers via Helmet
  app.use(helmet());

  // Trust proxy for Render/Vercel/Cloudflare reverse proxies
  app.set("trust proxy", 1);

  // Structured HTTP request logging with Pino
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === "/api/health",
      },
    })
  );

  // Body parsing limited to 100kb
  app.use(express.json({ limit: "100kb" }));

  // Health check endpoint validating Prisma 7 connection
  app.get("/api/health", async (_req, res, next) => {
    try {
      const dbCheck = await checkPrismaConnection();
      const firstRow = dbCheck[0];

      sendSuccess(res, {
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          client: "prisma-7",
          currentTime: firstRow?.current_time,
          databaseName: firstRow?.database_name,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // 404 handler
  app.use(notFoundHandler);

  // Global authoritative error handler
  app.use(errorHandler);

  return app;
}
