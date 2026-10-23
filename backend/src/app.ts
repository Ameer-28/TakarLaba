import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { toNodeHandler } from "better-auth/node";
import { logger } from "./lib/logger.js";
import { auth } from "./lib/auth.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { sameOriginMiddleware } from "./middleware/same-origin.js";
import { apiRateLimiter } from "./middleware/rate-limit.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

export function createApp() {
  const app = express();

  // 1. Security headers via Helmet
  app.use(helmet());

  // 2. Trust proxy for reverse proxies (Render, Vercel, Cloudflare).
  // NOTE: Nilai "trust proxy" perlu diverifikasi untuk dua hop di produksi (Vercel rewrite -> host backend).
  app.set("trust proxy", 1);

  // 3. Request ID & Structured HTTP request logging with Pino
  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as express.Request).id,
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

  // 4. Handler Better Auth WAJIB dipasang sebelum express.json() (lihat AGENTS.md §2 & §4).
  // Better Auth consumes the raw request stream; mounting express.json() earlier causes auth requests to hang or fail.
  app.all(["/api/auth", "/api/auth/*splat"], toNodeHandler(auth));

  // 5. Body parsing limited to 100kb
  app.use(express.json({ limit: "100kb" }));

  // 6. Strict same-origin check for non-GET mutating requests
  app.use(sameOriginMiddleware);

  // 7. General API rate limiter
  app.use(apiRateLimiter);

  // 8. API Routes
  app.use("/api", apiRouter);

  // 9. 404 handler
  app.use(notFoundHandler);

  // 10. Global authoritative error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
