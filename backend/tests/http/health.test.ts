import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../src/lib/db.js", () => ({
  checkPrismaConnection: vi.fn(),
  prisma: {
    $disconnect: vi.fn(),
  },
}));

import { checkPrismaConnection } from "../../src/lib/db.js";
import { createApp } from "../../src/create-app.js";

describe("GET /api/health", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with minimal payload when database is healthy", async () => {
    vi.mocked(checkPrismaConnection).mockResolvedValueOnce(undefined);

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      data: {
        status: "ok",
        db: "ok",
      },
    });
  });

  it("returns 503 DATABASE_UNAVAILABLE when database fails", async () => {
    vi.mocked(checkPrismaConnection).mockRejectedValueOnce(new Error("Connection refused"));

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      ok: false,
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "Layanan database tidak tersedia",
      },
    });
  });
});
