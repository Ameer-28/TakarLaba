import { Router } from "express";
import { analyticsService } from "../services/analytics.service.js";
import { requireAuth, requireRole, requireCtx } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  menuEngineeringQuerySchema,
  wasteRadarQuerySchema,
  type MenuEngineeringQuery,
  type WasteRadarQuery,
} from "../validation/analytics.schema.js";

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

// GET /api/analytics/menu-engineering - Matriks Menu Engineering (OWNER only)
analyticsRouter.get(
  "/analytics/menu-engineering",
  requireAuth,
  requireRole(["OWNER"]),
  validate(menuEngineeringQuerySchema, "query"),
  async (req, res) => {
    const ctx = requireCtx(req);
    const valid = req.valid as MenuEngineeringQuery;
    const days = valid?.days ?? 30;
    const data = await analyticsService.getMenuEngineering(ctx.businessId, days);
    res.json({ ok: true, data });
  }
);

// GET /api/analytics/waste-radar - Waste Radar: nilai risiko, menu terkait, batas diskon promo (OWNER only, FR-WST-01)
analyticsRouter.get(
  "/analytics/waste-radar",
  requireAuth,
  requireRole(["OWNER"]),
  validate(wasteRadarQuerySchema, "query"),
  async (req, res) => {
    const ctx = requireCtx(req);
    const valid = req.valid as WasteRadarQuery;
    const data = await analyticsService.getWasteRadar(ctx.businessId, valid?.days);
    res.json({ ok: true, data });
  }
);
