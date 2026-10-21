import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../src/lib/db.js", () => ({
  checkPrismaConnection: vi.fn(),
  prisma: {
    $disconnect: vi.fn(),
  },
  pool: {
    end: vi.fn(),
  },
}));

import { checkPrismaConnection } from "../../src/lib/db.js";
import app from "../../src/index.js";

describe("Serverless entry default export (backend/src/index.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports an Express application instance that serves /api/health", async () => {
    vi.mocked(checkPrismaConnection).mockResolvedValueOnce(undefined);

    expect(typeof app).toBe("function");

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
});
