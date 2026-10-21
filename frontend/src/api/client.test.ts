import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient, ApiError } from "./client.js";

describe("apiClient", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("wraps fetch network rejections (TypeError) into ApiError with status 0 and NETWORK_ERROR", async () => {
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(apiClient("/test")).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(0);
      expect(apiErr.code).toBe("NETWORK_ERROR");
      expect(apiErr.message).toContain("Gagal terhubung");
      return true;
    });
  });

  it("rethrows AbortError as-is without wrapping into ApiError", async () => {
    const abortError = new Error("The user aborted a request.");
    abortError.name = "AbortError";
    globalThis.fetch = vi.fn().mockRejectedValueOnce(abortError);

    await expect(apiClient("/test")).rejects.toThrow("The user aborted a request.");
  });

  it("returns undefined without parsing error when status is 204", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 204,
      text: vi.fn().mockResolvedValueOnce(""),
    } as unknown as Response);

    const result = await apiClient("/delete-something");
    expect(result).toBeUndefined();
  });

  it("returns undefined without parsing error when response body is empty", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce("   "),
    } as unknown as Response);

    const result = await apiClient("/empty-response");
    expect(result).toBeUndefined();
  });

  it("throws UPSTREAM_ERROR when response is not valid JSON (e.g. 502 HTML from reverse proxy)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 502,
      text: vi.fn().mockResolvedValueOnce("<html><body>502 Bad Gateway</body></html>"),
    } as unknown as Response);

    await expect(apiClient("/proxy-error")).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(502);
      expect(apiErr.code).toBe("UPSTREAM_ERROR");
      return true;
    });
  });

  it("throws ApiError with server error details when envelope has ok: false", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 404,
      text: vi.fn().mockResolvedValueOnce(
        JSON.stringify({
          ok: false,
          error: {
            code: "NOT_FOUND",
            message: "Item tidak ditemukan",
          },
        })
      ),
    } as unknown as Response);

    await expect(apiClient("/item/999")).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(404);
      expect(apiErr.code).toBe("NOT_FOUND");
      expect(apiErr.message).toBe("Item tidak ditemukan");
      return true;
    });
  });

  it("returns data unwrapped from envelope when ok: true", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(
        JSON.stringify({
          ok: true,
          data: { status: "ok", count: 42 },
        })
      ),
    } as unknown as Response);

    const result = await apiClient<{ status: string; count: number }>("/stats");
    expect(result).toEqual({ status: "ok", count: 42 });
  });
});
