import { Router } from "express";
import { analyticsService } from "../services/analytics.service.js";
import { requireAuth, requireRole, requireCtx } from "../middleware/auth.js";

export const analyticsRouter = Router();

// GET /api/analytics/capacity - Kapasitas & bottleneck porsi menu (OWNER & CASHIER)
analyticsRouter.get(
  "/analytics/capacity",
  requireAuth,
  requireRole(["OWNER", "CASHIER"]),
  async (req, res) => {
    const ctx = requireCtx(req);
    const data = await analyticsService.getMenuCapacities(ctx.businessId, ctx.role);
    res.json({ ok: true, data });
  }
);
