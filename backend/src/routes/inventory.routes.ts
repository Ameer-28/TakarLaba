import { Router } from "express";
import { inventoryService } from "../services/inventory.service.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  stockSummaryQuerySchema,
  inventoryBatchesQuerySchema,
  type StockSummaryQuery,
  type InventoryBatchesQuery,
} from "../validation/inventory.schema.js";
import type { Role } from "../types/express.js";

export const inventoryRouter = Router();

// 1. GET /api/inventory/summary - Stock overview with FEFO status
inventoryRouter.get(
  "/inventory/summary",
  requireAuth,
  requireRole(["OWNER", "CASHIER"]),
  validate(stockSummaryQuerySchema, "query"),
  async (req, res, next) => {
    try {
      const ctx = req.ctx!;
      const query = req.valid?.query as StockSummaryQuery;
      const warnDays = query?.warnDays ?? 3;

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
  validate(inventoryBatchesQuerySchema, "query"),
  async (req, res, next) => {
    try {
      const ctx = req.ctx!;
      const query = req.valid?.query as InventoryBatchesQuery;
      const ingredientId = query?.ingredientId;
      const hasRemainingOnly = query?.hasRemainingOnly ?? true;
      const warnDays = query?.warnDays ?? 3;

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
