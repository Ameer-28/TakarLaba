import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

vi.mock("../../src/lib/db.js", () => ({
  prisma: {
    business: {
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    session: {
      count: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => cb(prisma)),
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
  cleanDemoBusiness: vi.fn(),
  getDemoPassword: vi.fn(() => "DemoPassword123!"),
}));

vi.mock("../../src/config/env.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/config/env.js")>();
  return {
    ...actual,
    env: {
      ...actual.env,
      DEMO_MODE: true,
      FRONTEND_URL: "http://localhost:5173",
    },
  };
});

import { prisma } from "../../src/lib/db.js";
import { auth } from "../../src/lib/auth.js";
import { seedDemo } from "../../src/seed/seed-demo.js";
import { env } from "../../src/config/env.js";
import { createApp } from "../../src/create-app.js";
import { errorHandler } from "../../src/middleware/error-handler.js";
import { DEMO_BUSINESS_ID } from "../../src/seed/fixture-data.js";
import { DemoService } from "../../src/services/demo.service.js";
import { createDemoRouter } from "../../src/routes/demo.routes.js";

describe("Demo Endpoints (/api/demo)", () => {
  const app = createApp();

  const demoOwnerSession = {
    user: {
      id: "demo-owner-id",
      email: "owner@takarlaba.demo",
      role: "OWNER",
      businessId: DEMO_BUSINESS_ID,
      isActive: true,
      name: "Demo Pemilik",
    },
    session: {
      id: "sess-owner-1",
      userId: "demo-owner-id",
      expiresAt: new Date(Date.now() + 3600000),
    },
  };

  const demoCashierSession = {
    user: {
      id: "demo-cashier-id",
      email: "kasir@takarlaba.demo",
      role: "CASHIER",
      businessId: DEMO_BUSINESS_ID,
      isActive: true,
      name: "Demo Kasir",
    },
    session: {
      id: "sess-cashier-1",
      userId: "demo-cashier-id",
      expiresAt: new Date(Date.now() + 3600000),
    },
  };

  const nonDemoOwnerSession = {
    user: {
      id: "other-owner-id",
      email: "owner@other.id",
      role: "OWNER",
      businessId: "biz-other",
      isActive: true,
      name: "Other Owner",
    },
    session: {
      id: "sess-other-1",
      userId: "other-owner-id",
      expiresAt: new Date(Date.now() + 3600000),
    },
  };

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
    it("rejects unauthenticated reset requests with 401 UNAUTHENTICATED", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

      const res = await request(app).post("/api/demo/reset").set("Origin", env.FRONTEND_URL);

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHENTICATED");
      expect(seedDemo).not.toHaveBeenCalled();
    });

    it("rejects CASHIER reset requests with 403 FORBIDDEN", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(demoCashierSession);

      const res = await request(app).post("/api/demo/reset").set("Origin", env.FRONTEND_URL);

      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
      expect(seedDemo).not.toHaveBeenCalled();
    });

    it("rejects reset requests from non-demo business with 401 UNAUTHENTICATED", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(nonDemoOwnerSession);
      vi.mocked(prisma.business.findUnique).mockResolvedValueOnce({
        id: "biz-other",
        isDemo: false,
        demoResetAt: null,
      } as unknown as import("@prisma/client").Business);

      const res = await request(app).post("/api/demo/reset").set("Origin", env.FRONTEND_URL);

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHENTICATED");
      expect(seedDemo).not.toHaveBeenCalled();
    });

    it("returns 429 DEMO_COOLDOWN when cooldown is active for demo OWNER", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(demoOwnerSession);

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

    it("resets demo business and updates demoResetAt when cooldown has expired for demo OWNER", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(demoOwnerSession);

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
      vi.mocked(prisma.session.count).mockResolvedValue(0);

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
      vi.mocked(prisma.session.count).mockResolvedValue(0);

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

    it("reuses existing active demo session without creating a new session row", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(demoOwnerSession);

      const res = await request(app)
        .post("/api/demo/login")
        .set("Origin", env.FRONTEND_URL)
        .set("Cookie", "better-auth.session_token=existing-valid-token")
        .send({ role: "OWNER" });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.role).toBe("OWNER");
      expect(res.body.data.user).toEqual(demoOwnerSession.user);
      // signInEmail must not have been called because session was reused
      expect(auth.api.signInEmail).not.toHaveBeenCalled();
    });

    it("returns 429 RATE_LIMITED when IP rate limit is exceeded (> 10 logins per 10 mins)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);
      // Simulate IP login count >= 10
      vi.mocked(prisma.session.count).mockResolvedValueOnce(10);

      const res = await request(app)
        .post("/api/demo/login")
        .set("Origin", env.FRONTEND_URL)
        .send({ role: "OWNER" });

      expect(res.status).toBe(429);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("RATE_LIMITED");
      expect(res.body.error.message).toContain("Terlalu banyak percobaan masuk akun demo");
      expect(auth.api.signInEmail).not.toHaveBeenCalled();
    });

    it("returns 429 RATE_LIMITED when global rate limit is exceeded (> 60 logins per hour)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);
      // IP limit ok (< 10), but global limit >= 60
      vi.mocked(prisma.session.count).mockResolvedValueOnce(2).mockResolvedValueOnce(60);

      const res = await request(app)
        .post("/api/demo/login")
        .set("Origin", env.FRONTEND_URL)
        .send({ role: "OWNER" });

      expect(res.status).toBe(429);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("RATE_LIMITED");
      expect(res.body.error.message).toContain("Batas akses demo global tercapai");
      expect(auth.api.signInEmail).not.toHaveBeenCalled();
    });
  });

  describe("When DEMO_MODE=false", () => {
    const disabledApp = express();
    disabledApp.use(express.json());
    disabledApp.use("/api", createDemoRouter(new DemoService(false)));
    disabledApp.use(errorHandler);

    it("returns 403 FORBIDDEN on GET /api/demo/status", async () => {
      const res = await request(disabledApp).get("/api/demo/status");
      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
      expect(res.body.error.message).toContain("Mode demo dinonaktifkan");
    });

    it("returns 403 FORBIDDEN on POST /api/demo/reset", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(demoOwnerSession);

      const res = await request(disabledApp).post("/api/demo/reset");
      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
      expect(res.body.error.message).toContain("Mode demo dinonaktifkan");
    });

    it("returns 403 FORBIDDEN on POST /api/demo/login", async () => {
      const res = await request(disabledApp).post("/api/demo/login").send({ role: "OWNER" });
      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
      expect(res.body.error.message).toContain("Mode demo dinonaktifkan");
    });
  });
});
