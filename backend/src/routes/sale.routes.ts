import { Router } from "express";
import { saleService } from "../services/sale.service.js";
import { requireAuth, requireRole, requireCtx } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createSaleSchema, type CreateSaleInput } from "../validation/sale.schema.js";
import { ValidationError } from "../lib/errors.js";

export const saleRouter = Router();

/**
 * 1. POST /api/sales - Checkout POS sale transaction atomically with FEFO stock deduction
 * Allowed for both OWNER and CASHIER roles.
 * Requires header `Idempotency-Key`.
 */
saleRouter.post(
  "/sales",
  requireAuth,
  requireRole(["OWNER", "CASHIER"]),
  validate(createSaleSchema),
  async (req, res) => {
    const ctx = requireCtx(req);
    const input = req.valid as CreateSaleInput;

    const rawIdempotency = req.header("Idempotency-Key") || req.header("idempotency-key");
    if (
      !rawIdempotency ||
      typeof rawIdempotency !== "string" ||
      rawIdempotency.trim().length === 0
    ) {
      throw new ValidationError("Header Idempotency-Key wajib disertakan pada transaksi penjualan");
    }

    const sale = await saleService.checkout(
      ctx.businessId,
      ctx.userId,
      ctx.role as "OWNER" | "CASHIER",
      rawIdempotency.trim(),
      input
    );

    res.status(201).json({ ok: true, data: sale });
  }
);

/**
 * 2. GET /api/sales/:id - Retrieve details of a sale transaction
 * Allowed for both OWNER and CASHIER roles.
 */
saleRouter.get("/sales/:id", requireAuth, requireRole(["OWNER", "CASHIER"]), async (req, res) => {
  const ctx = requireCtx(req);
  const saleId = req.params.id as string;

  const sale = await saleService.getSaleById(
    ctx.businessId,
    saleId,
    ctx.role as "OWNER" | "CASHIER"
  );

  res.json({ ok: true, data: sale });
});
