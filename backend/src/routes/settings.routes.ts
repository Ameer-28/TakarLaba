import { Router } from "express";
import { settingsService } from "../services/settings.service.js";
import { requireAuth, requireRole, requireCtx } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { updateSettingsSchema, type UpdateSettingsInput } from "../validation/settings.schema.js";

export const settingsRouter = Router();

// GET /api/settings - View business settings (OWNER only)
settingsRouter.get("/settings", requireAuth, requireRole(["OWNER"]), async (req, res) => {
  const ctx = requireCtx(req);
  const settings = await settingsService.getSettings(ctx.businessId);
  res.json({ ok: true, data: settings });
});

// PATCH /api/settings - Update business settings (OWNER only)
settingsRouter.patch(
  "/settings",
  requireAuth,
  requireRole(["OWNER"]),
  validate(updateSettingsSchema),
  async (req, res) => {
    const ctx = requireCtx(req);
    const input = req.body as UpdateSettingsInput;
    const settings = await settingsService.updateSettings(ctx.businessId, input);
    res.json({ ok: true, data: settings });
  }
);
