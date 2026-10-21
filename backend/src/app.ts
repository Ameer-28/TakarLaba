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

  // Trust proxy for reverse proxies (Render, Vercel, Cloudflare).
  // NOTE: Nilai "trust proxy" perlu diverifikasi untuk dua hop di produksi (Vercel rewrite -> host backend).
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

  // NOTE: Handler Better Auth WAJIB dipasang sebelum express.json() (lihat AGENTS.md §2 & §4).
  // app.all("/api/auth/*splat", toNodeHandler(auth));

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
