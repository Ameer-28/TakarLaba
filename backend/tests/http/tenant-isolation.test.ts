import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { requireAuth, requireRole } from "../../src/middleware/auth.js";
import { sanitizeForRole, sanitizeListForRole } from "../../src/dto/role-mapper.js";
import { errorHandler } from "../../src/middleware/error-handler.js";
import { NotFoundError } from "../../src/lib/errors.js";

// Mock Better Auth session resolver
vi.mock("../../src/lib/auth.js", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { auth } from "../../src/lib/auth.js";

describe("Tenant Isolation & RBAC Framework (T-018)", () => {
  let app: express.Express;

  // Simulated Database Stores for Tenant A and Tenant B
  interface MockProduct {
    id: string;
    businessId: string;
    name: string;
    sellingPrice: string;
    costPerBase: string;
    hppBahan: string;
    hppPenuh: string;
    marginKontribusi: string;
    marginPercent: string;
  }

  const mockDbProducts: MockProduct[] = [
    {
      id: "prod-a-001",
      businessId: "biz-alpha",
      name: "Kopi Susu Gula Aren",
      sellingPrice: "18000.00",
      costPerBase: "12.500000",
      hppBahan: "6500.00",
      hppPenuh: "7500.00",
      marginKontribusi: "10500.00",
      marginPercent: "58.33",
    },
    {
      id: "prod-b-001",
      businessId: "biz-beta",
      name: "Teh Tarik Beta",
      sellingPrice: "12000.00",
      costPerBase: "8.000000",
      hppBahan: "4000.00",
      hppPenuh: "5000.00",
      marginKontribusi: "7000.00",
      marginPercent: "58.33",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());

    // 1. Endpoint: List Products (Allowed for OWNER and CASHIER)
    app.get("/api/products", requireAuth, requireRole(["OWNER", "CASHIER"]), (req, res) => {
      // Rule 5: Scoped strictly to verified tenant businessId from req.ctx
      const tenantId = req.ctx.businessId;
      const tenantProducts = mockDbProducts.filter((p) => p.businessId === tenantId);

      // Rule 7: Role DTO filtering
      const sanitized = sanitizeListForRole(tenantProducts, req.ctx.role);
      res.json({ ok: true, data: sanitized });
    });

    // 2. Endpoint: Product Detail (Isolated by businessId)
    app.get(
      "/api/products/:id",
      requireAuth,
      requireRole(["OWNER", "CASHIER"]),
      (req, res, next) => {
        const tenantId = req.ctx.businessId;
        const product = mockDbProducts.find(
          (p) => p.id === req.params.id && p.businessId === tenantId
        );

        if (!product) {
          return next(new NotFoundError("Produk tidak ditemukan"));
        }

        const sanitized = sanitizeForRole(product, req.ctx.role);
        res.json({ ok: true, data: sanitized });
      }
    );

    // 3. Endpoint: Owner-Only Settings & Costing Config
    app.post("/api/costing-settings", requireAuth, requireRole(["OWNER"]), (req, res) => {
      res.json({
        ok: true,
        data: {
          targetMarginDefault: "50.00",
          businessId: req.ctx.businessId,
        },
      });
    });

    // Mount global error handler
    app.use(errorHandler);
  });

  describe("Tenant Isolation (Multi-Tenancy Guard)", () => {
    it("strictly scopes query to req.ctx.businessId (Tenant A cannot see Tenant B data)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: {
          id: "user-alpha-001",
          email: "owner@alpha.test",
          name: "Owner Alpha",
          role: "OWNER",
          businessId: "biz-alpha",
          isActive: true,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "session-001",
          userId: "user-alpha-001",
          token: "tok-001",
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const res = await request(app).get("/api/products");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe("prod-a-001");
      expect(res.body.data[0].name).toBe("Kopi Susu Gula Aren");
    });

    it("prevents tenant spoofing when client supplies unauthorized businessId in query", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: {
          id: "user-alpha-001",
          email: "owner@alpha.test",
          name: "Owner Alpha",
          role: "OWNER",
          businessId: "biz-alpha",
          isActive: true,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "session-001",
          userId: "user-alpha-001",
          token: "tok-001",
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Malicious query attempt trying to fetch biz-beta data
      const res = await request(app).get("/api/products?businessId=biz-beta");

      expect(res.status).toBe(200);
      // Still only returns biz-alpha products because ctx.businessId is authoritative
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].businessId).toBe("biz-alpha");
    });

    it("returns 404 NOT_FOUND when User from Tenant A accesses an ID belonging to Tenant B", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: {
          id: "user-alpha-001",
          email: "owner@alpha.test",
          name: "Owner Alpha",
          role: "OWNER",
          businessId: "biz-alpha",
          isActive: true,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "session-001",
          userId: "user-alpha-001",
          token: "tok-001",
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Tenant A tries to access Tenant B's product: "prod-b-001"
      const res = await request(app).get("/api/products/prod-b-001");

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("RBAC & Role-Based Security", () => {
    it("allows OWNER to access owner-only endpoints", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: {
          id: "user-owner-001",
          email: "owner@alpha.test",
          name: "Owner Alpha",
          role: "OWNER",
          businessId: "biz-alpha",
          isActive: true,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "session-001",
          userId: "user-owner-001",
          token: "tok-001",
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const res = await request(app).post("/api/costing-settings");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.targetMarginDefault).toBe("50.00");
    });

    it("rejects CASHIER on owner-only endpoints with 403 FORBIDDEN", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: {
          id: "user-cashier-001",
          email: "kasir@alpha.test",
          name: "Kasir Alpha",
          role: "CASHIER",
          businessId: "biz-alpha",
          isActive: true,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "session-002",
          userId: "user-cashier-001",
          token: "tok-002",
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const res = await request(app).post("/api/costing-settings");

      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
      expect(res.body.error.message).toContain("CASHIER");
    });
  });

  describe("Role DTO Sanitization (Rule 7)", () => {
    it("returns full cost and margin fields to OWNER", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: {
          id: "user-owner-001",
          email: "owner@alpha.test",
          name: "Owner Alpha",
          role: "OWNER",
          businessId: "biz-alpha",
          isActive: true,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "session-001",
          userId: "user-owner-001",
          token: "tok-001",
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const res = await request(app).get("/api/products/prod-a-001");

      expect(res.status).toBe(200);
      expect(res.body.data.hppBahan).toBe("6500.00");
      expect(res.body.data.hppPenuh).toBe("7500.00");
      expect(res.body.data.marginKontribusi).toBe("10500.00");
      expect(res.body.data.costPerBase).toBe("12.500000");
    });

    it("strips all cost and margin fields from CASHIER response", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: {
          id: "user-cashier-001",
          email: "kasir@alpha.test",
          name: "Kasir Alpha",
          role: "CASHIER",
          businessId: "biz-alpha",
          isActive: true,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "session-002",
          userId: "user-cashier-001",
          token: "tok-002",
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const res = await request(app).get("/api/products/prod-a-001");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("prod-a-001");
      expect(res.body.data.name).toBe("Kopi Susu Gula Aren");
      expect(res.body.data.sellingPrice).toBe("18000.00");

      // Strictly stripped (Rule 7)
      expect(res.body.data.costPerBase).toBeUndefined();
      expect(res.body.data.purchaseUnitPrice).toBeUndefined();
      expect(res.body.data.hppBahan).toBeUndefined();
      expect(res.body.data.hppPenuh).toBeUndefined();
      expect(res.body.data.marginKontribusi).toBeUndefined();
      expect(res.body.data.marginPercent).toBeUndefined();
    });
  });

  describe("Authentication Guard Failures", () => {
    it("returns 401 UNAUTHENTICATED when request has no session", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

      const res = await request(app).get("/api/products");

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHENTICATED");
    });

    it("returns 403 FORBIDDEN when user account is inactive", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: {
          id: "user-inactive-001",
          email: "inactive@alpha.test",
          name: "Inactive User",
          role: "OWNER",
          businessId: "biz-alpha",
          isActive: false, // Inactive
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "session-003",
          userId: "user-inactive-001",
          token: "tok-003",
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const res = await request(app).get("/api/products");

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
      expect(res.body.error.message).toContain("dinonaktifkan");
    });

    it("returns 403 FORBIDDEN when user has no linked businessId", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: {
          id: "user-orphan-001",
          email: "orphan@alpha.test",
          name: "Orphan User",
          role: "OWNER",
          businessId: "" as unknown as string, // Missing business link
          isActive: true,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "session-004",
          userId: "user-orphan-001",
          token: "tok-004",
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const res = await request(app).get("/api/products");

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
      expect(res.body.error.message).toContain("belum terhubung");
    });
  });
});
