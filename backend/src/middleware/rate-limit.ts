import rateLimit from "express-rate-limit";
import { AppError } from "../lib/errors.js";

/**
 * Standard API rate limiter.
 * Limits requests per client window to protect resources from abusive traffic.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 120, // 120 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      new AppError(
        "Terlalu banyak permintaan, silakan coba beberapa saat lagi",
        "RATE_LIMITED",
        429
      )
    );
  },
});
