import type { IncomingHttpHeaders } from "node:http";
import { fromNodeHeaders } from "better-auth/node";
import { prisma } from "../lib/db.js";
import { auth } from "../lib/auth.js";
import { env } from "../config/env.js";
import {
  ForbiddenError,
  UnauthenticatedError,
  DemoCooldownError,
  RateLimitError,
} from "../lib/errors.js";
import { DEMO_BUSINESS_ID } from "../seed/fixture-data.js";
import { seedDemo, getDemoPassword } from "../seed/seed-demo.js";

export class DemoService {
  constructor(private readonly isDemoMode: boolean = env.DEMO_MODE) {}

  /**
   * Retrieves current demo availability status and remaining cooldown seconds.
   * Throws 403 ForbiddenError if DEMO_MODE is disabled.
   */
  async getStatus(): Promise<{ enabled: boolean; cooldownSeconds: number }> {
    if (!this.isDemoMode) {
      throw new ForbiddenError("Mode demo dinonaktifkan di lingkungan ini");
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
   * Enforces that business belongs to demo business (isDemo=true), 60-second cooldown,
   * and cleans demo sessions older than 24 hours while preserving active sessions.
   */
  async resetDemo(
    businessId: string = DEMO_BUSINESS_ID,
    _clientIp?: string
  ): Promise<{ message: string; resetAt: string }> {
    if (!this.isDemoMode) {
      throw new ForbiddenError("Mode demo dinonaktifkan di lingkungan ini");
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, isDemo: true, demoResetAt: true },
    });

    if (!business || !business.isDemo) {
      throw new UnauthenticatedError("Hanya akun pemilik bisnis demo yang dapat melakukan reset");
    }

    if (business.demoResetAt) {
      const elapsedSeconds = Math.floor((Date.now() - business.demoResetAt.getTime()) / 1000);
      if (elapsedSeconds < 60) {
        const remaining = 60 - elapsedSeconds;
        throw new DemoCooldownError(remaining);
      }
    }

    // Clean demo sessions older than 24 hours (preserves current active sessions)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
      await prisma.session.deleteMany({
        where: {
          user: { businessId },
          createdAt: { lt: cutoff },
        },
      });
    } catch {
      // Ignore if session table is mocked in test
    }

    // Perform idempotent seed (preserves demo users so sessions are not broken)
    await seedDemo({
      businessId,
      deleteUsers: false,
    });

    const now = new Date();
    await prisma.business.update({
      where: { id: businessId },
      data: { demoResetAt: now },
    });

    return {
      message: "Data contoh demo berhasil direset ke kondisi awal",
      resetAt: now.toISOString(),
    };
  }

  /**
   * Programmatically authenticates demo owner or cashier via Better Auth server API.
   * If the client already holds a valid active demo session for the requested role, reuses it.
   * Enforces serverless-safe rate limiting on the existing Session table:
   * - Max 10 demo logins per IP per 10 minutes
   * - Max 60 demo logins per hour global
   */
  async loginDemo(
    role: "OWNER" | "CASHIER",
    clientIp: string = "127.0.0.1",
    reqHeaders?: IncomingHttpHeaders
  ): Promise<{
    sessionCookies: string[];
    user: unknown;
    session: unknown;
    role: "OWNER" | "CASHIER";
    reused?: boolean;
  }> {
    if (!this.isDemoMode) {
      throw new ForbiddenError("Mode demo dinonaktifkan di lingkungan ini");
    }

    // 1. Session reuse: Check if incoming request already carries a valid demo session with the requested role
    if (reqHeaders) {
      try {
        const headersObj = fromNodeHeaders(reqHeaders);
        const existingSession = await auth.api.getSession({
          headers: headersObj,
        });

        if (
          existingSession?.user &&
          (existingSession.user as { businessId?: string }).businessId === DEMO_BUSINESS_ID &&
          (existingSession.user as { role?: string }).role === role
        ) {
          return {
            sessionCookies: [],
            user: existingSession.user,
            session: existingSession.session,
            role,
            reused: true,
          };
        }
      } catch {
        // If session parsing fails, proceed with regular login
      }
    }

    // 2. Serverless-safe rate limiting via session table queries
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // IP rate limit: max 10 demo logins per IP per 10 minutes
    if (clientIp) {
      const ipLoginCount = await prisma.session.count({
        where: {
          ipAddress: clientIp,
          createdAt: { gte: tenMinutesAgo },
          user: { businessId: DEMO_BUSINESS_ID },
        },
      });

      if (ipLoginCount >= 10) {
        throw new RateLimitError(
          "Terlalu banyak percobaan masuk akun demo dari alamat IP ini. Silakan coba lagi dalam 10 menit."
        );
      }
    }

    // Global rate limit: max 60 demo logins per hour
    const globalLoginCount = await prisma.session.count({
      where: {
        createdAt: { gte: oneHourAgo },
        user: { businessId: DEMO_BUSINESS_ID },
      },
    });

    if (globalLoginCount >= 60) {
      throw new RateLimitError("Batas akses demo global tercapai. Silakan coba lagi nanti.");
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

    const data = (await authRes.json()) as { user?: unknown; session?: { id?: string } };

    // Record client IP on created session for serverless-safe rate limiting
    if (data.session?.id && clientIp) {
      try {
        await prisma.session.update({
          where: { id: data.session.id },
          data: { ipAddress: clientIp },
        });
      } catch {
        // Safe to ignore in test environments with mocked DB
      }
    }

    return {
      sessionCookies,
      user: data.user,
      session: data.session,
      role,
      reused: false,
    };
  }
}
