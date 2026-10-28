import { Router } from "express";
import { purchaseService } from "../services/purchase.service.js";
import { requireAuth, requireRole, requireCtx } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createPurchaseSchema,
  queryPurchaseSchema,
  type CreatePurchaseInput,
  type QueryPurchaseInput,
} from "../validation/purchase.schema.js";

export const purchaseRouter = Router();

// 1. POST /api/purchases - Record multi-row purchase / nota belanja (OWNER only)
purchaseRouter.post(
  "/purchases",
  requireAuth,
  requireRole(["OWNER"]),
  validate(createPurchaseSchema),
  async (req, res) => {
    const ctx = requireCtx(req);
    const input = req.valid as CreatePurchaseInput;
    const created = await purchaseService.createPurchase(ctx.businessId, ctx.userId, input);
    res.status(201).json({ ok: true, data: created });
  }
);

// 2. GET /api/purchases - List purchase records for tenant (OWNER only)
purchaseRouter.get("/purchases", requireAuth, requireRole(["OWNER"]), async (req, res) => {
  const ctx = requireCtx(req);
  const parsedQuery = queryPurchaseSchema.parse(req.query) as QueryPurchaseInput;

  const skip = (parsedQuery.page - 1) * parsedQuery.limit;
  const take = parsedQuery.limit;

  let startDate: Date | undefined;
  let endDate: Date | undefined;
  if (parsedQuery.startDate) startDate = new Date(parsedQuery.startDate);
  if (parsedQuery.endDate) endDate = new Date(parsedQuery.endDate);

  const result = await purchaseService.listPurchases(ctx.businessId, {
    startDate,
    endDate,
    supplier: parsedQuery.supplier,
    skip,
    take,
  });

  res.json({
    ok: true,
    data: result.items,
    meta: {
      total: result.total,
      page: parsedQuery.page,
      limit: parsedQuery.limit,
      totalPages: Math.ceil(result.total / parsedQuery.limit),
    },
  });
});

// 3. GET /api/purchases/:id - Get purchase details with batches and movements (OWNER only)
purchaseRouter.get("/purchases/:id", requireAuth, requireRole(["OWNER"]), async (req, res) => {
  const ctx = requireCtx(req);
  const id = req.params.id as string;
  const purchase = await purchaseService.getPurchaseById(ctx.businessId, id);
  res.json({ ok: true, data: purchase });
});
