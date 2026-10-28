import { Router } from "express";
import { overheadService } from "../services/overhead.service.js";
import { requireAuth, requireRole, requireCtx } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createOverheadSchema,
  updateOverheadSchema,
  type CreateOverheadInput,
  type UpdateOverheadInput,
} from "../validation/overhead.schema.js";

export const overheadRouter = Router();

// 1. GET /api/overheads - List overheads & summary (OWNER only)
overheadRouter.get("/overheads", requireAuth, requireRole(["OWNER"]), async (req, res) => {
  const ctx = requireCtx(req);
  const isActiveParam = req.query.isActive;
  let isActive: boolean | undefined;
  if (isActiveParam === "true") isActive = true;
  if (isActiveParam === "false") isActive = false;

  const result = await overheadService.getOverheads(ctx.businessId, { isActive });
  res.json({ ok: true, data: result });
});

// 2. POST /api/overheads - Create new overhead cost (OWNER only)
overheadRouter.post(
  "/overheads",
  requireAuth,
  requireRole(["OWNER"]),
  validate(createOverheadSchema),
  async (req, res) => {
    const ctx = requireCtx(req);
    const input = req.body as CreateOverheadInput;
    const created = await overheadService.createOverhead(ctx.businessId, input);
    res.status(201).json({ ok: true, data: created });
  }
);

// 3. PATCH /api/overheads/:id - Update overhead cost (OWNER only)
overheadRouter.patch(
  "/overheads/:id",
  requireAuth,
  requireRole(["OWNER"]),
  validate(updateOverheadSchema),
  async (req, res) => {
    const ctx = requireCtx(req);
    const id = req.params.id as string;
    const input = req.body as UpdateOverheadInput;
    const updated = await overheadService.updateOverhead(ctx.businessId, id, input);
    res.json({ ok: true, data: updated });
  }
);

// 4. DELETE /api/overheads/:id - Delete overhead cost (OWNER only)
overheadRouter.delete("/overheads/:id", requireAuth, requireRole(["OWNER"]), async (req, res) => {
  const ctx = requireCtx(req);
  const id = req.params.id as string;
  const result = await overheadService.deleteOverhead(ctx.businessId, id);
  res.json({ ok: true, data: result });
});
