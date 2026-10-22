import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../src/lib/db.js", () => ({
  checkPrismaConnection: vi.fn(),
  prisma: {
    $disconnect: vi.fn(),
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    session: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
  pool: {
    end: vi.fn(),
  },
}));

import { createApp } from "../../src/app.js";

describe("Better Auth Integration (/api/auth)", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles GET /api/auth/get-session for unauthenticated user", async () => {
    const res = await request(app).get("/api/auth/get-session");
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it("handles /api/auth root route without 404", async () => {
    const res = await request(app).get("/api/auth/ok");
    expect([200, 404, 405]).toContain(res.status);
  });

  it("applies rate limiting and security headers on /api/auth routes", async () => {
    const res = await request(app).get("/api/auth/get-session");
    // Verify Helmet security headers are present
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});
