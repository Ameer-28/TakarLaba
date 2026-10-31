import { Router } from "express";
import { alertService } from "../services/alert.service.js";
import { requireAuth, requireRole, requireCtx } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  queryAlertSchema,
  dismissAlertSchema,
  type QueryAlertInput,
  type DismissAlertInput,
} from "../validation/alert.schema.js";

export const alertRouter = Router();

// 1. GET /api/alerts - List alerts for business with pagination & status filter (OWNER only)
alertRouter.get("/alerts", requireAuth, requireRole(["OWNER"]), async (req, res) => {
  const ctx = requireCtx(req);
  const query = queryAlertSchema.parse(req.query) as QueryAlertInput;

  const skip = (query.page - 1) * query.limit;
  const take = query.limit;

  const { items, total } = await alertService.listAlerts(ctx.businessId, {
    status: query.status,
    menuId: query.menuId,
    skip,
    take,
  });

  res.json({
    ok: true,
    data: items,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  });
});

// 2. GET /api/alerts/:id - Get alert detail with recipes and options A & B (OWNER only)
alertRouter.get("/alerts/:id", requireAuth, requireRole(["OWNER"]), async (req, res) => {
  const ctx = requireCtx(req);
  const id = req.params.id as string;
  const alert = await alertService.getAlertById(ctx.businessId, id);

  res.json({
    ok: true,
    data: alert,
  });
});

// 3. POST /api/alerts/:id/apply-price - Apply recommended price (Option A) to menu (OWNER only)
alertRouter.post(
  "/alerts/:id/apply-price",
  requireAuth,
  requireRole(["OWNER"]),
  async (req, res) => {
    const ctx = requireCtx(req);
    const id = req.params.id as string;
    const resolved = await alertService.applyRecommendedPrice(ctx.businessId, id, ctx.userId);

    res.json({
      ok: true,
      data: resolved,
    });
  }
);

// 4. POST /api/alerts/:id/dismiss - Dismiss alert with optional note (OWNER only)
alertRouter.post(
  "/alerts/:id/dismiss",
  requireAuth,
  requireRole(["OWNER"]),
  validate(dismissAlertSchema),
  async (req, res) => {
    const ctx = requireCtx(req);
    const id = req.params.id as string;
    const input = req.valid as DismissAlertInput;
    const resolved = await alertService.dismissAlert(ctx.businessId, id, ctx.userId, input.note);

    res.json({
      ok: true,
      data: resolved,
    });
  }
);

// 5. POST /api/alerts/:id/acknowledge - Shift alert status to ACKNOWLEDGED (OWNER only)
alertRouter.post(
  "/alerts/:id/acknowledge",
  requireAuth,
  requireRole(["OWNER"]),
  async (req, res) => {
    const ctx = requireCtx(req);
    const id = req.params.id as string;
    const acknowledged = await alertService.acknowledgeAlert(ctx.businessId, id);

    res.json({
      ok: true,
      data: acknowledged,
    });
  }
);
