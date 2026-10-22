import { Router } from "express";
import { inventoryService } from "../services/inventory.service.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import type { Role } from "../types/express.js";

export const inventoryRouter = Router();

// 1. GET /api/inventory/summary - Stock overview with FEFO status
inventoryRouter.get(
  "/inventory/summary",
  requireAuth,
  requireRole(["OWNER", "CASHIER"]),
  async (req, res, next) => {
    try {
      const ctx = req.ctx!;
      const warnDays = req.query.warnDays ? Number(req.query.warnDays) : 3;

      const summary = await inventoryService.getStockSummary(
        ctx.businessId,
        ctx.role as Role,
        warnDays
      );

      res.json({ ok: true, data: summary });
    } catch (err) {
      next(err);
    }
  }
);

// 2. GET /api/inventory/batches - Batch list ordered by FEFO
inventoryRouter.get(
  "/inventory/batches",
  requireAuth,
  requireRole(["OWNER", "CASHIER"]),
  async (req, res, next) => {
    try {
      const ctx = req.ctx!;
      const ingredientId =
        typeof req.query.ingredientId === "string" ? req.query.ingredientId : undefined;
      const hasRemainingOnly = req.query.hasRemainingOnly !== "false";
      const warnDays = req.query.warnDays ? Number(req.query.warnDays) : 3;

      const batches = await inventoryService.getBatches(
        ctx.businessId,
        ctx.role as Role,
        {
          ingredientId,
          hasRemainingOnly,
        },
        warnDays
      );

      res.json({ ok: true, data: batches });
    } catch (err) {
      next(err);
    }
  }
);
