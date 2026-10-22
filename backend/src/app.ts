import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { logger } from "./lib/logger.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

export function createApp() {
  const app = express();

  // Security headers via Helmet (compatible with ESM namespace and default export interop)
  type HelmetHandler = () => express.RequestHandler;
  const helmetFn = (
    typeof helmet === "function" ? helmet : (helmet as { default: HelmetHandler }).default
  ) as HelmetHandler;
  app.use(helmetFn());

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

  // Serverless in-memory state note:
  // In serverless deployment (Vercel Functions), memory state (such as express-rate-limit
  // MemoryStore) is instance-scoped, resets on cold start, and is not shared across instances.
  // Sessions rely on PostgreSQL (Better Auth tables), which persists across serverless instances.
  // For strict distributed rate limiting, an external store (e.g. Redis/Upstash) should be used.

  // NOTE: Handler Better Auth WAJIB dipasang sebelum express.json() (lihat AGENTS.md §2 & §4).
  // Better Auth consumes the raw request stream; mounting express.json() earlier causes auth requests to hang or fail.
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

export const app = createApp();
export default app;
