import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requireAuth, requireRole, requireCtx } from "../middleware/auth.js";
import { sendSuccess } from "../lib/envelope.js";
import { demoLoginSchema, type DemoLoginInput } from "../validation/demo.schema.js";
import { DemoService } from "../services/demo.service.js";

export function createDemoRouter(service: DemoService = new DemoService()): Router {
  const router = Router();

  /**
   * GET /api/demo/status
   * Public endpoint returning whether demo mode is enabled and cooldown seconds.
   */
  router.get("/demo/status", async (_req, res, next) => {
    try {
      const status = await service.getStatus();
      sendSuccess(res, status, 200);
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/demo/reset
   * Protected endpoint to reset demo business back to initial fixture state.
   * Requires active session of demo business OWNER (Rule 6, Rule 20).
   * Enforces DEMO_MODE=true and 60-second cooldown.
   */
  router.post("/demo/reset", requireAuth, requireRole(["OWNER"]), async (req, res, next) => {
    try {
      const ctx = requireCtx(req);
      const clientIp = req.ip || req.socket.remoteAddress || "127.0.0.1";
      const result = await service.resetDemo(ctx.businessId, clientIp);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/demo/login
   * Public endpoint to programmatically sign in as demo OWNER or CASHIER.
   * Reuses existing session if client already holds a valid active demo session.
   * Forwards session cookies so frontend can immediately start a valid session.
   * Enforces serverless-safe rate limiting (max 10 logins per IP per 10 mins, 60 per hour global).
   */
  router.post("/demo/login", validate(demoLoginSchema), async (req, res, next) => {
    try {
      const { role } = req.valid as DemoLoginInput;
      const clientIp = req.ip || req.socket.remoteAddress || "127.0.0.1";
      const result = await service.loginDemo(role, clientIp, req.headers);

      if (result.sessionCookies.length > 0) {
        res.setHeader("set-cookie", result.sessionCookies);
      }

      sendSuccess(
        res,
        {
          user: result.user,
          session: result.session,
          role: result.role,
        },
        200
      );
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export const demoRouter = createDemoRouter();
