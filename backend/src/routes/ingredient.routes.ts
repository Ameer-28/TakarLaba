import { Router } from "express";
import { ingredientService } from "../services/ingredient.service.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createIngredientSchema,
  updateIngredientSchema,
  purchaseUnitInputSchema,
  type CreateIngredientInput,
  type UpdateIngredientInput,
  type PurchaseUnitInput,
  ingredientCategoryEnum,
} from "../validation/ingredient.schema.js";
import type { IngredientCategory } from "../generated/prisma/enums.js";

export const ingredientRouter = Router();

// 1. GET /api/ingredients - List ingredients for tenant
ingredientRouter.get(
  "/ingredients",
  requireAuth,
  requireRole(["OWNER", "CASHIER"]),
  async (req, res, next) => {
    try {
      const ctx = req.ctx!;
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const category = typeof req.query.category === "string" ? req.query.category : undefined;
      const isActiveParam = req.query.isActive;

      let isActive: boolean | undefined;
      if (isActiveParam === "true") isActive = true;
      if (isActiveParam === "false") isActive = false;

      let parsedCategory: IngredientCategory | undefined;
      if (category) {
        parsedCategory = ingredientCategoryEnum.parse(category);
      }

      const ingredients = await ingredientService.listIngredients(ctx.businessId, {
        search,
        category: parsedCategory,
        isActive,
      });

      res.json({ ok: true, data: ingredients });
    } catch (err) {
      next(err);
    }
  }
);

// 2. GET /api/ingredients/:id - Ingredient detail
ingredientRouter.get(
  "/ingredients/:id",
  requireAuth,
  requireRole(["OWNER", "CASHIER"]),
  async (req, res, next) => {
    try {
      const ctx = req.ctx!;
      const id = req.params.id as string;
      const ingredient = await ingredientService.getIngredientById(ctx.businessId, id);
      res.json({ ok: true, data: ingredient });
    } catch (err) {
      next(err);
    }
  }
);

// 3. POST /api/ingredients - Create new ingredient (OWNER only)
ingredientRouter.post(
  "/ingredients",
  requireAuth,
  requireRole(["OWNER"]),
  validate(createIngredientSchema),
  async (req, res, next) => {
    try {
      const ctx = req.ctx!;
      const input = req.valid as CreateIngredientInput;
      const created = await ingredientService.createIngredient(ctx.businessId, input);
      res.status(201).json({ ok: true, data: created });
    } catch (err) {
      next(err);
    }
  }
);

// 4. PATCH /api/ingredients/:id - Update ingredient (OWNER only)
ingredientRouter.patch(
  "/ingredients/:id",
  requireAuth,
  requireRole(["OWNER"]),
  validate(updateIngredientSchema),
  async (req, res, next) => {
    try {
      const ctx = req.ctx!;
      const id = req.params.id as string;
      const input = req.valid as UpdateIngredientInput;
      const updated = await ingredientService.updateIngredient(ctx.businessId, id, input);
      res.json({ ok: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// 5. DELETE /api/ingredients/:id - Soft delete (deactivate) ingredient (OWNER only)
ingredientRouter.delete(
  "/ingredients/:id",
  requireAuth,
  requireRole(["OWNER"]),
  async (req, res, next) => {
    try {
      const ctx = req.ctx!;
      const id = req.params.id as string;
      const deactivated = await ingredientService.toggleActive(ctx.businessId, id, false);
      res.json({ ok: true, data: deactivated });
    } catch (err) {
      next(err);
    }
  }
);

// 6. POST /api/ingredients/:id/units - Add purchase conversion unit (OWNER only)
ingredientRouter.post(
  "/ingredients/:id/units",
  requireAuth,
  requireRole(["OWNER"]),
  validate(purchaseUnitInputSchema),
  async (req, res, next) => {
    try {
      const ctx = req.ctx!;
      const id = req.params.id as string;
      const input = req.valid as PurchaseUnitInput;
      const unit = await ingredientService.addPurchaseUnit(ctx.businessId, id, input);
      res.status(201).json({ ok: true, data: unit });
    } catch (err) {
      next(err);
    }
  }
);

// 7. DELETE /api/ingredients/:id/units/:unitId - Delete purchase unit (OWNER only)
ingredientRouter.delete(
  "/ingredients/:id/units/:unitId",
  requireAuth,
  requireRole(["OWNER"]),
  async (req, res, next) => {
    try {
      const ctx = req.ctx!;
      const id = req.params.id as string;
      const unitId = req.params.unitId as string;
      await ingredientService.deletePurchaseUnit(ctx.businessId, id, unitId);
      res.json({ ok: true, data: { success: true } });
    } catch (err) {
      next(err);
    }
  }
);
