import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/create-app.js";

vi.mock("../../src/lib/db.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    business: {
      create: vi.fn(),
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
      signUpEmail: vi.fn(),
      getSession: vi.fn(),
    },
  },
}));

vi.mock("../../src/config/env.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/config/env.js")>();
  return {
    ...actual,
    env: {
      ...actual.env,
      FRONTEND_URL: "http://localhost:5173",
    },
  };
});

import { prisma } from "../../src/lib/db.js";
import { auth } from "../../src/lib/auth.js";

describe("Registration Routes & Service (FR-AUTH-04)", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPayload = {
    name: "Budi Santoso",
    businessName: "Kopi Mantap Jiwa",
    email: "budi@kopimantap.id",
    password: "Password123!",
  };

  it("registers a new business owner successfully (201 Created)", async () => {
    // 1. Email does not exist
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    // 2. Better Auth signUpEmail succeeds
    const mockAuthResponse = {
      ok: true,
      headers: {
        getSetCookie: () => ["better-auth.session_token=mock-token; Path=/; HttpOnly"],
        get: () => "better-auth.session_token=mock-token; Path=/; HttpOnly",
      },
      json: async () => ({
        user: {
          id: "user-new-owner-1",
          name: "Budi Santoso",
          email: "budi@kopimantap.id",
        },
      }),
    };
    vi.mocked(auth.api.signUpEmail).mockResolvedValue(mockAuthResponse as never);

    // 3. Business created
    vi.mocked(prisma.business.create).mockResolvedValue({
      id: "biz-mantap-1",
      name: "Kopi Mantap Jiwa",
      isDemo: false,
      targetMarginDefault: "50.00" as never,
      expiryWarnDays: 3,
      priceRoundingStep: 500,
      expectedMonthlyPortions: 1000,
      wastePromoMinMargin: "10.00" as never,
      timezone: "Asia/Jakarta",
      createdAt: new Date(),
      demoResetAt: null,
    });

    // 4. User updated to OWNER
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: "user-new-owner-1",
      name: "Budi Santoso",
      email: "budi@kopimantap.id",
      role: "OWNER",
      businessId: "biz-mantap-1",
      isActive: true,
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post("/api/register")
      .set("Origin", "http://localhost:5173")
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.user).toEqual({
      id: "user-new-owner-1",
      name: "Budi Santoso",
      email: "budi@kopimantap.id",
      role: "OWNER",
      businessId: "biz-mantap-1",
      isActive: true,
    });
    expect(res.body.data.business).toEqual({
      id: "biz-mantap-1",
      name: "Kopi Mantap Jiwa",
      isDemo: false,
      targetMarginDefault: "50.00",
      expectedMonthlyPortions: 1000,
      priceRoundingStep: 500,
      expiryWarnDays: 3,
    });

    // Session cookie should be set in header
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"][0]).toContain("better-auth.session_token");
  });

  it("returns 409 Conflict if email is already registered", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "existing-user-1",
    } as never);

    const res = await request(app)
      .post("/api/register")
      .set("Origin", "http://localhost:5173")
      .send(validPayload);

    expect(res.status).toBe(409);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe("CONFLICT");
    expect(res.body.error.message).toContain("Email sudah terdaftar");
    expect(auth.api.signUpEmail).not.toHaveBeenCalled();
  });

  it("returns 400 Validation Error for invalid inputs", async () => {
    // Missing required fields
    const res1 = await request(app)
      .post("/api/register")
      .set("Origin", "http://localhost:5173")
      .send({});

    expect(res1.status).toBe(400);
    expect(res1.body.ok).toBe(false);
    expect(res1.body.error.code).toBe("VALIDATION_ERROR");

    // Password too short (< 8 chars)
    const res2 = await request(app)
      .post("/api/register")
      .set("Origin", "http://localhost:5173")
      .send({
        ...validPayload,
        password: "123",
      });

    expect(res2.status).toBe(400);
    expect(res2.body.ok).toBe(false);
    expect(res2.body.error.code).toBe("VALIDATION_ERROR");

    // Invalid email format
    const res3 = await request(app)
      .post("/api/register")
      .set("Origin", "http://localhost:5173")
      .send({
        ...validPayload,
        email: "not-an-email",
      });

    expect(res3.status).toBe(400);
    expect(res3.body.ok).toBe(false);
    expect(res3.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rolls back Better Auth user if business creation fails", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const mockAuthResponse = {
      ok: true,
      headers: {
        getSetCookie: () => ["better-auth.session_token=mock-token"],
        get: () => "better-auth.session_token=mock-token",
      },
      json: async () => ({
        user: {
          id: "user-to-rollback-1",
          name: "Budi Santoso",
          email: "budi@kopimantap.id",
        },
      }),
    };
    vi.mocked(auth.api.signUpEmail).mockResolvedValue(mockAuthResponse as never);

    vi.mocked(prisma.business.create).mockRejectedValue(new Error("Database connection error"));
    vi.mocked(prisma.user.delete).mockResolvedValue({} as never);

    const res = await request(app)
      .post("/api/register")
      .set("Origin", "http://localhost:5173")
      .send(validPayload);

    expect(res.status).toBe(500);
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: "user-to-rollback-1" },
    });
  });
});
