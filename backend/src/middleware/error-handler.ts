import type { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors.js";
import { sendError } from "../lib/envelope.js";
import { logger } from "../lib/logger.js";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    sendError(res, err.code, err.message, err.statusCode, err.fieldErrors);
    return;
  }

  // Unhandled internal server error
  logger.error({ err, path: req.path, method: req.method }, "Unhandled server exception");

  sendError(res, "INTERNAL_ERROR", "Terjadi kesalahan internal pada server", 500);
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, "NOT_FOUND", `Rute ${req.method} ${req.path} tidak ditemukan`, 404);
}
