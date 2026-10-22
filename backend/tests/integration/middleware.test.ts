import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { z } from "zod";

vi.mock("../../src/lib/db.js", () => ({
  checkPrismaConnection: vi.fn(),
  prisma: {
    $disconnect: vi.fn(),
    user: { findUnique: vi.fn(), findFirst: vi.fn() },
    session: { findUnique: vi.fn(), findFirst: vi.fn() },
  },
  pool: { end: vi.fn() },
}));

vi.mock("../../src/lib/auth.js", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { auth } from "../../src/lib/auth.js";
import { createApp } from "../../src/app.js";
import { requireAuth, requireRole } from "../../src/middleware/auth.js";
import { validate } from "../../src/middleware/validate.js";
import { errorHandler } from "../../src/middleware/error-handler.js";

describe("Core Middlewares Suite (T-012)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requestIdMiddleware & App Setup", () => {
    const app = createApp();

    it("generates and attaches X-Request-Id header on responses", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.headers["x-request-id"]).toBeDefined();
      expect(typeof res.headers["x-request-id"]).toBe("string");
    });

    it("respects client-supplied X-Request-Id header", async () => {
      const customId = "custom-test-trace-id-12345";
      const res = await request(app).get("/api/health").set("X-Request-Id", customId);

      expect(res.status).toBe(200);
      expect(res.headers["x-request-id"]).toBe(customId);
    });
  });

  describe("sameOriginMiddleware", () => {
    const app = createApp();

    it("allows GET requests without Origin header", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
    });

    it("allows mutating POST requests with trusted Origin header", async () => {
      const res = await request(app)
        .post("/api/health")
        .set("Origin", "http://localhost:5173")
        .send({ test: true });

      // Path /api/health has no POST handler, so expect 404 or method not allowed, but NOT 403 Forbidden
      expect(res.status).not.toBe(403);
    });

    it("rejects mutating POST requests from untrusted Origin with 403 FORBIDDEN", async () => {
      const res = await request(app)
        .post("/api/health")
        .set("Origin", "https://malicious-attacker-website.com")
        .send({ test: true });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: "Akses lintas-origin tidak diizinkan",
        },
      });
    });
  });

  describe("validate middleware (Zod 4)", () => {
    const testApp = express();
    testApp.use(express.json());

    const bodySchema = z.object({
      name: z.string().min(3, { message: "Nama minimal 3 karakter" }),
      price: z.number().positive({ message: "Harga harus lebih besar dari 0" }),
    });

    testApp.post("/test-validate", validate(bodySchema), (req, res) => {
      res.json({ ok: true, data: req.valid });
    });
    testApp.use(errorHandler);

    it("passes and stores parsed data in req.valid for valid body", async () => {
      const res = await request(testApp)
        .post("/test-validate")
        .send({ name: "Kopi Gula Aren", price: 18000 });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.name).toBe("Kopi Gula Aren");
      expect(res.body.data.price).toBe(18000);
    });

    it("returns 400 VALIDATION_ERROR with fieldErrors on invalid body", async () => {
      const res = await request(testApp).post("/test-validate").send({ name: "A", price: -500 });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validasi input gagal",
          fieldErrors: {
            name: ["Nama minimal 3 karakter"],
            price: ["Harga harus lebih besar dari 0"],
          },
        },
      });
    });
  });

  describe("requireAuth & requireRole middleware", () => {
    const authApp = express();
    authApp.use(express.json());

    authApp.get("/protected", requireAuth, (req, res) => {
      res.json({ ok: true, data: req.ctx });
    });

    authApp.get("/owner-only", requireAuth, requireRole("OWNER"), (req, res) => {
      res.json({ ok: true, message: "Welcome owner", data: req.ctx });
    });

    authApp.use(errorHandler);

    type MockSessionResult = Awaited<ReturnType<typeof auth.api.getSession>>;

    it("returns 401 UNAUTHENTICATED when session is null", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as unknown as MockSessionResult);

      const res = await request(authApp).get("/protected");
      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHENTICATED");
    });

    it("returns 403 FORBIDDEN when user has no businessId", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: {
          id: "u1",
          name: "Owner Tanpa Bisnis",
          email: "owner@test.com",
          role: "OWNER",
          businessId: undefined,
          isActive: true,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "s1",
          userId: "u1",
          expiresAt: new Date(),
          token: "t1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as unknown as MockSessionResult);

      const res = await request(authApp).get("/protected");
      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 403 FORBIDDEN when user isActive is false", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: {
          id: "u1",
          name: "User Nonaktif",
          email: "nonaktif@test.com",
          role: "OWNER",
          businessId: "biz-1",
          isActive: false,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "s1",
          userId: "u1",
          expiresAt: new Date(),
          token: "t1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as unknown as MockSessionResult);

      const res = await request(authApp).get("/protected");
      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("populates req.ctx with tenant context for valid active session", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: {
          id: "u123",
          name: "Budi Owner",
          email: "budi@kopi.com",
          role: "OWNER",
          businessId: "biz-kopi-kenangan",
          isActive: true,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "s1",
          userId: "u123",
          expiresAt: new Date(),
          token: "t1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as unknown as MockSessionResult);

      const res = await request(authApp).get("/protected");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toEqual({
        userId: "u123",
        businessId: "biz-kopi-kenangan",
        role: "OWNER",
        email: "budi@kopi.com",
        name: "Budi Owner",
      });
    });

    it("allows OWNER role to access owner-only endpoint", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: {
          id: "u123",
          name: "Budi Owner",
          email: "budi@kopi.com",
          role: "OWNER",
          businessId: "biz-kopi-kenangan",
          isActive: true,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "s1",
          userId: "u123",
          expiresAt: new Date(),
          token: "t1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as unknown as MockSessionResult);

      const res = await request(authApp).get("/owner-only");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.message).toBe("Welcome owner");
    });

    it("rejects CASHIER role from owner-only endpoint with 403 FORBIDDEN", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: {
          id: "u456",
          name: "Siti Kasir",
          email: "siti@kopi.com",
          role: "CASHIER",
          businessId: "biz-kopi-kenangan",
          isActive: true,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "s2",
          userId: "u456",
          expiresAt: new Date(),
          token: "t2",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as unknown as MockSessionResult);

      const res = await request(authApp).get("/owner-only");
      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });
});
