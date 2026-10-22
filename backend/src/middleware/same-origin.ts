import type { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../lib/errors.js";
import { env } from "../config/env.js";

const trustedOrigins = new Set([
  new URL(env.FRONTEND_URL).origin,
  ...(env.NODE_ENV === "development"
    ? [
        "http://localhost:5173",
        "http://localhost:4000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:4000",
      ]
    : []),
]);

/**
 * Strict same-origin verification for mutating HTTP methods (POST, PUT, PATCH, DELETE).
 * Protects against CSRF attacks in cross-origin browser requests.
 */
export function sameOriginMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // Safe idempotent methods do not mutate state and are allowed without origin check
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    next();
    return;
  }

  const originHeader = req.headers.origin;
  const refererHeader = req.headers.referer;

  if (originHeader) {
    try {
      const parsedOrigin = new URL(originHeader).origin;
      if (!trustedOrigins.has(parsedOrigin)) {
        throw new ForbiddenError("Akses lintas-origin tidak diizinkan");
      }
    } catch (err) {
      if (err instanceof ForbiddenError) throw err;
      throw new ForbiddenError("Header origin tidak valid");
    }
  } else if (refererHeader) {
    try {
      const parsedRefererOrigin = new URL(refererHeader).origin;
      if (!trustedOrigins.has(parsedRefererOrigin)) {
        throw new ForbiddenError("Akses lintas-origin tidak diizinkan");
      }
    } catch (err) {
      if (err instanceof ForbiddenError) throw err;
      throw new ForbiddenError("Header referer tidak valid");
    }
  }

  next();
}
