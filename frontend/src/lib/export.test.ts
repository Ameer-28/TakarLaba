import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { downloadCsv } from "./export";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("CSV Export Download Utility (T-201 — FR-RPT-01)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("handles successful CSV download and shows success toast", async () => {
    const mockBlob = new Blob(["test-csv-content"], { type: "text/csv" });
    const mockHeaders = new Headers({
      "content-disposition": 'attachment; filename="penjualan-2026-11-05.csv"',
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: mockHeaders,
      blob: async () => mockBlob,
    });

    // Mock window & document URL/link
    const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url");
    const revokeObjectURLMock = vi.fn();
    globalThis.URL.createObjectURL = createObjectURLMock;
    globalThis.URL.revokeObjectURL = revokeObjectURLMock;

    const result = await downloadCsv("/export/sales.csv", "fallback.csv");

    expect(result).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/export/sales.csv", {
      method: "GET",
      credentials: "same-origin",
    });
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("penjualan-2026-11-05.csv"));
  });

  it("shows error toast when server returns error status", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        ok: false,
        error: { code: "FORBIDDEN", message: "Akses ditolak untuk kasir" },
      }),
    });

    const result = await downloadCsv("/export/sales.csv", "sales.csv");

    expect(result).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Akses ditolak untuk kasir");
  });

  it("handles network error gracefully and shows error toast", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network failed"));

    const result = await downloadCsv("/export/stock.csv", "stock.csv");

    expect(result).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Network failed");
  });
});
