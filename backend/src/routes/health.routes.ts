import { Router } from "express";
import { sendSuccess, sendError } from "../lib/envelope.js";
import { checkPrismaConnection } from "../lib/db.js";
import { logger } from "../lib/logger.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  try {
    await checkPrismaConnection();
    sendSuccess(res, { status: "ok", db: "ok" });
  } catch (err) {
    logger.error({ err }, "Database unavailable during health check");
    sendError(res, "DATABASE_UNAVAILABLE", "Layanan database tidak tersedia", 503);
  }
});
