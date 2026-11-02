import { prisma } from "../lib/db.js";
import { auth } from "../lib/auth.js";
import { env } from "../config/env.js";
import { ForbiddenError, UnauthenticatedError, DemoCooldownError } from "../lib/errors.js";
import { DEMO_BUSINESS_ID } from "../seed/fixture-data.js";
import { seedDemo, getDemoPassword } from "../seed/seed-demo.js";

export class DemoService {
  constructor(private readonly isDemoMode: boolean = env.DEMO_MODE) {}

  /**
   * Retrieves current demo availability status and remaining cooldown seconds.
   */
  async getStatus(): Promise<{ enabled: boolean; cooldownSeconds: number }> {
    if (!this.isDemoMode) {
      return { enabled: false, cooldownSeconds: 0 };
    }

    const business = await prisma.business.findUnique({
      where: { id: DEMO_BUSINESS_ID },
      select: { demoResetAt: true, isDemo: true },
    });

    if (!business || !business.isDemo || !business.demoResetAt) {
      return { enabled: true, cooldownSeconds: 0 };
    }

    const elapsedSeconds = Math.floor((Date.now() - business.demoResetAt.getTime()) / 1000);
    const cooldownSeconds = Math.max(0, 60 - elapsedSeconds);

    return { enabled: true, cooldownSeconds };
  }

  /**
   * Idempotently resets demo business data back to original PRD Lampiran B fixture state.
   * Enforces 60-second cooldown via business.demoResetAt.
   */
  async resetDemo(): Promise<{ message: string; resetAt: string }> {
    if (!this.isDemoMode) {
      throw new ForbiddenError("Mode demo dinonaktifkan di lingkungan ini");
    }

    const business = await prisma.business.findUnique({
      where: { id: DEMO_BUSINESS_ID },
      select: { id: true, isDemo: true, demoResetAt: true },
    });

    if (business && !business.isDemo) {
      throw new ForbiddenError("Hanya bisnis bertanda isDemo=true yang dapat direset");
    }

    if (business?.demoResetAt) {
      const elapsedSeconds = Math.floor((Date.now() - business.demoResetAt.getTime()) / 1000);
      if (elapsedSeconds < 60) {
        const remaining = 60 - elapsedSeconds;
        throw new DemoCooldownError(remaining);
      }
    }

    // Perform idempotent seed (preserves demo users so sessions are not broken)
    await seedDemo({
      businessId: DEMO_BUSINESS_ID,
      deleteUsers: false,
    });

    const now = new Date();
    await prisma.business.update({
      where: { id: DEMO_BUSINESS_ID },
      data: { demoResetAt: now },
    });

    return {
      message: "Data contoh demo berhasil direset ke kondisi awal",
      resetAt: now.toISOString(),
    };
  }

  /**
   * Programmatically authenticates demo owner or cashier via Better Auth server API,
   * returning the authentication response containing session cookies.
   */
  async loginDemo(role: "OWNER" | "CASHIER"): Promise<{
    sessionCookies: string[];
    user: unknown;
    session: unknown;
    role: "OWNER" | "CASHIER";
  }> {
    if (!this.isDemoMode) {
      throw new ForbiddenError("Mode demo dinonaktifkan di lingkungan ini");
    }

    const email = role === "OWNER" ? "owner@takarlaba.demo" : "kasir@takarlaba.demo";
    const password = getDemoPassword();

    const authRes = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      asResponse: true,
    });

    if (!authRes.ok) {
      throw new UnauthenticatedError(
        "Gagal masuk sebagai pengguna demo. Silakan pastikan data contoh telah diisi."
      );
    }

    // Extract session cookies from response headers
    let sessionCookies: string[] = [];
    if (typeof authRes.headers.getSetCookie === "function") {
      sessionCookies = authRes.headers.getSetCookie();
    } else {
      const single = authRes.headers.get("set-cookie");
      if (single) sessionCookies = [single];
    }

    const data = (await authRes.json()) as { user?: unknown; session?: unknown };

    return {
      sessionCookies,
      user: data.user,
      session: data.session,
      role,
    };
  }
}
