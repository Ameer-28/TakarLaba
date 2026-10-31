import { Router } from "express";
import { dashboardService } from "../services/dashboard.service.js";
import { requireAuth, requireRole, requireCtx } from "../middleware/auth.js";

export const dashboardRouter = Router();

/**
 * GET /api/dashboard/summary
 * Retrieves summary metrics, alerts, low capacity menus, and recent sales for the Owner Dashboard (FR-DASH-01).
 * Restricted to OWNER role only.
 */
dashboardRouter.get("/dashboard/summary", requireAuth, requireRole(["OWNER"]), async (req, res) => {
  const ctx = requireCtx(req);
  const data = await dashboardService.getSummary(ctx.businessId);
  res.json({ ok: true, data });
});
