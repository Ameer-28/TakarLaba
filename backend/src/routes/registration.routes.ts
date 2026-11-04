import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { registerOwnerSchema, type RegisterOwnerInput } from "../validation/registration.schema.js";
import { registrationService } from "../services/registration.service.js";

export const registrationRouter = Router();

/**
 * POST /api/register
 * Public endpoint to register a new business owner and workspace (FR-AUTH-04).
 * Creates Business, OWNER User, Better Auth credentials, sets session cookie,
 * and returns profile.
 */
registrationRouter.post("/register", validate(registerOwnerSchema), async (req, res, next) => {
  try {
    const input = req.valid as RegisterOwnerInput;
    const result = await registrationService.registerOwner(input);

    if (result.sessionCookies.length > 0) {
      res.setHeader("set-cookie", result.sessionCookies);
    }

    res.status(201).json({
      ok: true,
      data: {
        user: result.user,
        business: result.business,
      },
    });
  } catch (err) {
    next(err);
  }
});
