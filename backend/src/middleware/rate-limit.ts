import expressRateLimit from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors.js";

// Handle CJS/ESM interop across different TypeScript bundler environments (Vercel vs tsx)
type RateLimitFn = typeof expressRateLimit;

function resolveRateLimit(): RateLimitFn {
  const mod = expressRateLimit as unknown;
  if (typeof mod === "function") {
    return mod as RateLimitFn;
  }
  if (mod && typeof mod === "object") {
    if ("default" in mod && typeof (mod as { default: unknown }).default === "function") {
      return (mod as { default: RateLimitFn }).default;
    }
    if ("rateLimit" in mod && typeof (mod as { rateLimit: unknown }).rateLimit === "function") {
      return (mod as { rateLimit: RateLimitFn }).rateLimit;
    }
  }
  return mod as RateLimitFn;
}

const rateLimit = resolveRateLimit();

/**
 * Standard API rate limiter.
 * Limits requests per client window to protect resources from abusive traffic.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 120, // 120 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response, next: NextFunction) => {
    next(
      new AppError(
        "Terlalu banyak permintaan, silakan coba beberapa saat lagi",
        "RATE_LIMITED",
        429
      )
    );
  },
});
