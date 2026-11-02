import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { sendSuccess } from "../lib/envelope.js";
import { demoLoginSchema, type DemoLoginInput } from "../validation/demo.schema.js";
import { DemoService } from "../services/demo.service.js";

export const demoRouter = Router();
const demoService = new DemoService();

/**
 * GET /api/demo/status
 * Public endpoint returning whether demo mode is enabled and cooldown seconds.
 */
demoRouter.get("/demo/status", async (_req, res, next) => {
  try {
    const status = await demoService.getStatus();
    sendSuccess(res, status, 200);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/demo/reset
 * Public endpoint to reset demo business back to initial fixture state.
 * Enforces DEMO_MODE=true and 60-second cooldown.
 */
demoRouter.post("/demo/reset", async (_req, res, next) => {
  try {
    const result = await demoService.resetDemo();
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/demo/login
 * Public endpoint to programmatically sign in as demo OWNER or CASHIER.
 * Forwards session cookies so frontend can immediately start a valid session.
 */
demoRouter.post("/demo/login", validate(demoLoginSchema), async (req, res, next) => {
  try {
    const { role } = req.valid as DemoLoginInput;
    const result = await demoService.loginDemo(role);

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
