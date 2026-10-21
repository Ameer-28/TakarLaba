import type { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors.js";
import { sendError } from "../lib/envelope.js";
import { logger } from "../lib/logger.js";

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    logger.warn({ err, path: req.path, method: req.method }, err.message);
    sendError(res, err.code, err.message, err.statusCode, err.fieldErrors);
    return;
  }

  // Handle body-parser / client request errors (e.g. malformed JSON, entity too large)
  if (typeof err === "object" && err !== null && ("status" in err || "statusCode" in err)) {
    const errorObj = err as { status?: number; statusCode?: number };
    const status = errorObj.status ?? errorObj.statusCode;

    if (typeof status === "number" && status >= 400 && status < 500) {
      logger.warn({ err, path: req.path, method: req.method }, "Client request error");

      if (status === 413) {
        sendError(res, "PAYLOAD_TOO_LARGE", "Ukuran permintaan melebihi batas maksimum 100kb", 413);
        return;
      }

      sendError(res, "BAD_REQUEST", "Permintaan tidak valid atau format data salah", status);
      return;
    }
  }

  // Unhandled internal server error
  logger.error({ err, path: req.path, method: req.method }, "Unhandled server exception");

  sendError(res, "INTERNAL_ERROR", "Terjadi kesalahan internal pada server", 500);
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, "NOT_FOUND", `Rute ${req.method} ${req.path} tidak ditemukan`, 404);
}
