import { Router } from "express";
import { menuService } from "../services/menu.service.js";
import { requireAuth, requireRole, requireCtx } from "../middleware/auth.js";

export const posRouter = Router();

/**
 * GET /api/pos/menus - List active sellable menus with portion capacity for POS (OWNER & CASHIER)
 * DTO allowlist: id, name, category, sellingPrice, hasRecipe, capacity, bottleneckIngredientName
 * Strips all cost/HPP/margin fields (Cashier Confidentiality Rule 7).
 */
posRouter.get("/pos/menus", requireAuth, requireRole(["OWNER", "CASHIER"]), async (req, res) => {
  const ctx = requireCtx(req);
  const menus = await menuService.getPosMenus(ctx.businessId);
  res.json({ ok: true, data: menus });
});
