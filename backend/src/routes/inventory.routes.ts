import { Router } from "express";
import { inventoryService } from "../services/inventory.service.js";
import { requireAuth, requireRole, requireCtx } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  stockSummaryQuerySchema,
  inventoryBatchesQuerySchema,
  recordWasteSchema,
  wasteQuerySchema,
  type StockSummaryQuery,
  type InventoryBatchesQuery,
  type RecordWasteInput,
  type WasteQuery,
} from "../validation/inventory.schema.js";
import type { Role } from "../types/express.js";

export const inventoryRouter = Router();

// 1. GET /api/inventory/summary - Stock overview with FEFO status
inventoryRouter.get(
  "/inventory/summary",
  requireAuth,
  requireRole(["OWNER", "CASHIER"]),
  validate(stockSummaryQuerySchema, "query"),
  async (req, res) => {
    const ctx = requireCtx(req);
    const query = req.valid?.query as StockSummaryQuery;
    const warnDays = query?.warnDays ?? 3;

    const summary = await inventoryService.getStockSummary(
      ctx.businessId,
      ctx.role as Role,
      warnDays
    );

    res.json({ ok: true, data: summary });
  }
);

// 2. GET /api/inventory/batches - Batch list ordered by FEFO
inventoryRouter.get(
  "/inventory/batches",
  requireAuth,
  requireRole(["OWNER", "CASHIER"]),
  validate(inventoryBatchesQuerySchema, "query"),
  async (req, res) => {
    const ctx = requireCtx(req);
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
  }
);

// 3. POST /api/inventory/waste & POST /api/stock/waste (FR-INV-03)
// Records wasted stock for a specific batch, reduces stock, and calculates loss value. OWNER only.
inventoryRouter.post(
  ["/inventory/waste", "/stock/waste"],
  requireAuth,
  requireRole(["OWNER"]),
  validate(recordWasteSchema),
  async (req, res) => {
    const ctx = requireCtx(req);
    const body = (req.valid?.body ?? req.body) as RecordWasteInput;

    const result = await inventoryService.recordWaste(ctx.businessId, ctx.userId, body);

    res.status(201).json({ ok: true, data: result });
  }
);

// 4. GET /api/inventory/waste & GET /api/stock/waste
// Retrieves waste history and loss records. OWNER only.
inventoryRouter.get(
  ["/inventory/waste", "/stock/waste"],
  requireAuth,
  requireRole(["OWNER"]),
  validate(wasteQuerySchema, "query"),
  async (req, res) => {
    const ctx = requireCtx(req);
    const query = req.valid?.query as WasteQuery;
    const limit = query?.limit ?? 50;
    const skip = query?.skip ?? 0;

    const history = await inventoryService.getWasteHistory(ctx.businessId, {
      take: limit,
      skip,
    });

    res.json({ ok: true, data: history });
  }
);
