import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";

/**
 * Middleware to assign or forward a unique Request ID.
 * - Extracts incoming `X-Request-Id` if provided.
 * - Otherwise generates a cryptographically random UUIDv4.
 * - Attaches to `req.id` and sets `X-Request-Id` response header.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const headerId = req.headers["x-request-id"];
  const id =
    typeof headerId === "string" && headerId.trim().length > 0
      ? headerId.trim()
      : crypto.randomUUID();

  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}
