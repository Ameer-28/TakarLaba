import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../src/lib/db.js", () => ({
  prisma: {
    business: {
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
  pool: {
    end: vi.fn(),
  },
}));

vi.mock("../../src/lib/auth.js", () => ({
  auth: {
    api: {
      signInEmail: vi.fn(),
      getSession: vi.fn(),
    },
  },
}));

vi.mock("../../src/seed/seed-demo.js", () => ({
  seedDemo: vi.fn(),
  getDemoPassword: vi.fn(() => "DemoPassword123!"),
}));

import { prisma } from "../../src/lib/db.js";
import { auth } from "../../src/lib/auth.js";
import { seedDemo } from "../../src/seed/seed-demo.js";
import { env } from "../../src/config/env.js";
import { createApp } from "../../src/create-app.js";
import { DEMO_BUSINESS_ID } from "../../src/seed/fixture-data.js";

describe("Demo Endpoints (/api/demo)", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/demo/status", () => {
    it("returns enabled: true and cooldownSeconds: 0 when no reset occurred recently", async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValueOnce({
        id: DEMO_BUSINESS_ID,
        isDemo: true,
        demoResetAt: null,
      } as unknown as import("@prisma/client").Business);

      const res = await request(app).get("/api/demo/status");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        ok: true,
        data: {
          enabled: true,
          cooldownSeconds: 0,
        },
      });
    });

    it("returns remaining cooldown when reset occurred 20 seconds ago", async () => {
      const resetTime = new Date(Date.now() - 20 * 1000);
      vi.mocked(prisma.business.findUnique).mockResolvedValueOnce({
        id: DEMO_BUSINESS_ID,
        isDemo: true,
        demoResetAt: resetTime,
      } as unknown as import("@prisma/client").Business);

      const res = await request(app).get("/api/demo/status");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.enabled).toBe(true);
      expect(res.body.data.cooldownSeconds).toBeGreaterThanOrEqual(39);
      expect(res.body.data.cooldownSeconds).toBeLessThanOrEqual(41);
    });
  });

  describe("POST /api/demo/reset", () => {
    it("returns 429 DEMO_COOLDOWN when cooldown is active", async () => {
      const resetTime = new Date(Date.now() - 15 * 1000); // 15 seconds ago (< 60s)
      vi.mocked(prisma.business.findUnique).mockResolvedValueOnce({
        id: DEMO_BUSINESS_ID,
        isDemo: true,
        demoResetAt: resetTime,
      } as unknown as import("@prisma/client").Business);

      const res = await request(app).post("/api/demo/reset").set("Origin", env.FRONTEND_URL);

      expect(res.status).toBe(429);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("DEMO_COOLDOWN");
      expect(res.body.error.message).toContain("Tunggu");
      expect(seedDemo).not.toHaveBeenCalled();
    });

    it("resets demo business and updates demoResetAt when cooldown has expired", async () => {
      const pastResetTime = new Date(Date.now() - 120 * 1000); // 120 seconds ago (> 60s)
      vi.mocked(prisma.business.findUnique).mockResolvedValueOnce({
        id: DEMO_BUSINESS_ID,
        isDemo: true,
        demoResetAt: pastResetTime,
      } as unknown as import("@prisma/client").Business);

      vi.mocked(seedDemo).mockResolvedValueOnce(undefined);
      vi.mocked(prisma.business.update).mockResolvedValueOnce({
        id: DEMO_BUSINESS_ID,
        demoResetAt: new Date(),
      } as unknown as import("@prisma/client").Business);

      const res = await request(app).post("/api/demo/reset").set("Origin", env.FRONTEND_URL);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.message).toContain("berhasil direset");
      expect(res.body.data.resetAt).toBeDefined();

      expect(seedDemo).toHaveBeenCalledWith({
        businessId: DEMO_BUSINESS_ID,
        deleteUsers: false,
      });
      expect(prisma.business.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: DEMO_BUSINESS_ID },
        })
      );
    });
  });

  describe("POST /api/demo/login", () => {
    it("rejects invalid role with 400 VALIDATION_ERROR", async () => {
      const res = await request(app)
        .post("/api/demo/login")
        .set("Origin", env.FRONTEND_URL)
        .send({ role: "INVALID_ROLE" });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("authenticates as OWNER and forwards session cookie", async () => {
      const mockUser = {
        id: "demo-owner-id",
        email: "owner@takarlaba.demo",
        role: "OWNER",
        name: "Demo Pemilik",
      };
      const mockSession = { id: "demo-owner-session-id" };

      const fakeResponse = {
        ok: true,
        headers: {
          get: (key: string) =>
            key.toLowerCase() === "set-cookie"
              ? "better-auth.session_token=fake-token; Path=/"
              : null,
          getSetCookie: () => ["better-auth.session_token=fake-token; Path=/"],
        },
        json: async () => ({ user: mockUser, session: mockSession }),
      };

      vi.mocked(auth.api.signInEmail).mockResolvedValueOnce(
        fakeResponse as unknown as Awaited<ReturnType<typeof auth.api.signInEmail>>
      );

      const res = await request(app)
        .post("/api/demo/login")
        .set("Origin", env.FRONTEND_URL)
        .send({ role: "OWNER" });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.role).toBe("OWNER");
      expect(res.body.data.user).toEqual(mockUser);
      expect(res.headers["set-cookie"]).toBeDefined();

      expect(auth.api.signInEmail).toHaveBeenCalledWith({
        body: {
          email: "owner@takarlaba.demo",
          password: "DemoPassword123!",
        },
        asResponse: true,
      });
    });

    it("authenticates as CASHIER and forwards session cookie", async () => {
      const mockUser = {
        id: "demo-cashier-id",
        email: "kasir@takarlaba.demo",
        role: "CASHIER",
        name: "Demo Kasir",
      };
      const mockSession = { id: "demo-cashier-session-id" };

      const fakeResponse = {
        ok: true,
        headers: {
          get: (key: string) =>
            key.toLowerCase() === "set-cookie"
              ? "better-auth.session_token=cashier-token; Path=/"
              : null,
          getSetCookie: () => ["better-auth.session_token=cashier-token; Path=/"],
        },
        json: async () => ({ user: mockUser, session: mockSession }),
      };

      vi.mocked(auth.api.signInEmail).mockResolvedValueOnce(
        fakeResponse as unknown as Awaited<ReturnType<typeof auth.api.signInEmail>>
      );

      const res = await request(app)
        .post("/api/demo/login")
        .set("Origin", env.FRONTEND_URL)
        .send({ role: "CASHIER" });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.role).toBe("CASHIER");
      expect(res.body.data.user).toEqual(mockUser);
      expect(res.headers["set-cookie"]).toBeDefined();

      expect(auth.api.signInEmail).toHaveBeenCalledWith({
        body: {
          email: "kasir@takarlaba.demo",
          password: "DemoPassword123!",
        },
        asResponse: true,
      });
    });
  });
});
