import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { logger } from "./lib/logger.js";
import { apiRouter } from "./routes/index.js";
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

  // API Routes
  app.use("/api", apiRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Global authoritative error handler
  app.use(errorHandler);

  return app;
}
