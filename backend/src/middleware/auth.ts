import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { UnauthenticatedError, ForbiddenError } from "../lib/errors.js";
import type { TenantContext } from "../types/express.d.js";

export type { TenantContext };

/**
 * Require valid authenticated user session via Better Auth.
 * Populates authoritative tenant context into `req.ctx = { userId, businessId, role, email, name }`.
 * Rejects with 401 UNAUTHENTICATED if session is missing or expired.
 * Rejects with 403 FORBIDDEN if user is inactive or has no associated business.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      throw new UnauthenticatedError(
        "Autentikasi diperlukan. Sesi tidak valid atau telah berakhir."
      );
    }

    const user = session.user as typeof session.user & {
      role?: string;
      businessId?: string;
      isActive?: boolean;
    };

    if (user.isActive === false) {
      throw new ForbiddenError("Akun pengguna telah dinonaktifkan.");
    }

    if (!user.businessId) {
      throw new ForbiddenError("Pengguna belum terhubung dengan bisnis yang valid.");
    }

    req.ctx = {
      userId: user.id,
      businessId: user.businessId,
      role: user.role || "OWNER",
      email: user.email,
      name: user.name,
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Enforce Role-Based Access Control (RBAC).
 * Ensures the authenticated user's role is included in allowedRoles.
 * Rejects with 403 FORBIDDEN if unauthorized.
 */
export function requireRole(...allowedRoles: (string | string[])[]) {
  const flattened = allowedRoles.flat();

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.ctx) {
      throw new UnauthenticatedError("Autentikasi diperlukan sebelum pemeriksaan peran.");
    }

    if (!flattened.includes(req.ctx.role)) {
      throw new ForbiddenError(
        `Peran Anda (${req.ctx.role}) tidak memiliki izin untuk melakukan tindakan ini.`
      );
    }

    next();
  };
}
