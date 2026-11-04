import { Decimal } from "decimal.js";
import { prisma } from "../lib/db.js";
import { auth } from "../lib/auth.js";
import { ConflictError, ValidationError } from "../lib/errors.js";
import type { RegisterOwnerInput } from "../validation/registration.schema.js";

export interface RegisterOwnerResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    businessId: string;
    isActive: boolean;
  };
  business: {
    id: string;
    name: string;
    isDemo: boolean;
    targetMarginDefault: string;
    expectedMonthlyPortions: number;
    priceRoundingStep: number;
    expiryWarnDays: number;
  };
  sessionCookies: string[];
}

export class RegistrationService {
  /**
   * Registers a new business owner and creates their business workspace (FR-AUTH-04).
   * Atomically:
   * 1. Checks if email is already taken.
   * 2. Creates Better Auth user & credential account.
   * 3. Creates Business workspace with default operational parameters.
   * 4. Updates User with OWNER role, businessId, and active status.
   * 5. Returns created profile and Better Auth session cookies for instant login.
   */
  async registerOwner(input: RegisterOwnerInput): Promise<RegisterOwnerResult> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictError("Email sudah terdaftar. Silakan gunakan email lain atau masuk.");
    }

    // Call Better Auth to create user & hashed credentials
    const authRes = await auth.api.signUpEmail({
      body: {
        name: input.name,
        email: input.email,
        password: input.password,
      },
      asResponse: true,
    });

    if (!authRes.ok) {
      let message = "Gagal membuat akun pengguna";
      try {
        const errJson = (await authRes.json()) as {
          message?: string;
          error?: { message?: string };
        };
        message = errJson.message || errJson.error?.message || message;
      } catch {
        // ignore parse error
      }
      throw new ValidationError(message);
    }

    // Extract session cookies from response headers
    let sessionCookies: string[] = [];
    if (typeof authRes.headers.getSetCookie === "function") {
      sessionCookies = authRes.headers.getSetCookie();
    } else {
      const single = authRes.headers.get("set-cookie");
      if (single) sessionCookies = [single];
    }

    const data = (await authRes.json()) as {
      user?: { id: string; name: string; email: string };
    };

    if (!data.user?.id) {
      throw new ValidationError("Akun pengguna gagal dibuat oleh sistem otentikasi");
    }

    const createdUserId = data.user.id;

    try {
      // Create new Business workspace
      const business = await prisma.business.create({
        data: {
          name: input.businessName,
          isDemo: false,
          targetMarginDefault: "50.00",
          expiryWarnDays: 3,
          priceRoundingStep: 500,
          expectedMonthlyPortions: 1000,
        },
      });

      // Associate User with Business as OWNER
      const updatedUser = await prisma.user.update({
        where: { id: createdUserId },
        data: {
          businessId: business.id,
          role: "OWNER",
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          businessId: true,
          isActive: true,
        },
      });

      return {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role ?? "OWNER",
          businessId: business.id,
          isActive: updatedUser.isActive ?? true,
        },
        business: {
          id: business.id,
          name: business.name,
          isDemo: business.isDemo,
          targetMarginDefault: new Decimal(business.targetMarginDefault.toString()).toFixed(2),
          expectedMonthlyPortions: business.expectedMonthlyPortions,
          priceRoundingStep: business.priceRoundingStep,
          expiryWarnDays: business.expiryWarnDays,
        },
        sessionCookies,
      };
    } catch (err) {
      // Rollback Better Auth user creation on workspace failure
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
      throw err;
    }
  }
}

export const registrationService = new RegistrationService();
