import { Router } from "express";
import { menuService } from "../services/menu.service.js";
import { requireAuth, requireRole, requireCtx } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createMenuSchema,
  updateMenuSchema,
  type CreateMenuInput,
  type UpdateMenuInput,
} from "../validation/menu.schema.js";

export const menuRouter = Router();

// 1. GET /api/menus - List menus for tenant (OWNER only)
menuRouter.get("/menus", requireAuth, requireRole(["OWNER"]), async (req, res) => {
  const ctx = requireCtx(req);
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const isActiveParam = req.query.isActive;

  let isActive: boolean | undefined;
  if (isActiveParam === "true") isActive = true;
  if (isActiveParam === "false") isActive = false;

  const menus = await menuService.listMenus(ctx.businessId, {
    search,
    category,
    isActive,
  });

  res.json({ ok: true, data: menus });
});

// 2. GET /api/menus/:id - Detail menu (OWNER only)
menuRouter.get("/menus/:id", requireAuth, requireRole(["OWNER"]), async (req, res) => {
  const ctx = requireCtx(req);
  const id = req.params.id as string;
  const menu = await menuService.getMenuById(ctx.businessId, id);
  res.json({ ok: true, data: menu });
});

// 3. POST /api/menus - Create new menu (OWNER only)
menuRouter.post(
  "/menus",
  requireAuth,
  requireRole(["OWNER"]),
  validate(createMenuSchema),
  async (req, res) => {
    const ctx = requireCtx(req);
    const input = req.valid as CreateMenuInput;
    const created = await menuService.createMenu(ctx.businessId, input);
    res.status(201).json({ ok: true, data: created });
  }
);

// 4. PATCH /api/menus/:id - Update menu (OWNER only)
menuRouter.patch(
  "/menus/:id",
  requireAuth,
  requireRole(["OWNER"]),
  validate(updateMenuSchema),
  async (req, res) => {
    const ctx = requireCtx(req);
    const id = req.params.id as string;
    const input = req.valid as UpdateMenuInput;
    const updated = await menuService.updateMenu(ctx.businessId, id, input, ctx.userId);
    res.json({ ok: true, data: updated });
  }
);

// 5. DELETE /api/menus/:id - Delete menu (OWNER only)
menuRouter.delete("/menus/:id", requireAuth, requireRole(["OWNER"]), async (req, res) => {
  const ctx = requireCtx(req);
  const id = req.params.id as string;
  const result = await menuService.deleteMenu(ctx.businessId, id);
  res.json({ ok: true, data: result });
});
