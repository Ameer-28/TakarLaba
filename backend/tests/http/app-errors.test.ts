import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/create-app.js";

describe("API request error handling", () => {
  const app = createApp();

  it("returns 400 for malformed JSON body", async () => {
    const res = await request(app)
      .post("/api/health")
      .set("Content-Type", "application/json")
      .send("{ malformed json ");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      error: {
        code: "BAD_REQUEST",
        message: expect.any(String),
      },
    });
  });

  it("returns 413 for oversized body (> 100kb)", async () => {
    const largePayload = JSON.stringify({ data: "x".repeat(1024 * 105) });

    const res = await request(app)
      .post("/api/health")
      .set("Content-Type", "application/json")
      .send(largePayload);

    expect(res.status).toBe(413);
    expect(res.body).toEqual({
      ok: false,
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: expect.any(String),
      },
    });
  });

  it("returns 404 with standard envelope for unknown route", async () => {
    const res = await request(app).get("/api/unknown-route");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: "Rute GET /api/unknown-route tidak ditemukan",
      },
    });
  });
});
