import { describe, it, expect } from "vitest";
import {
  isDemoActive,
  computeCooldownRemaining,
  formatCooldownBadge,
  formatResetButtonText,
} from "./demo-utils";

describe("demo-utils (pure helpers)", () => {
  it("determines whether demo mode is active", () => {
    expect(isDemoActive(null)).toBe(false);
    expect(isDemoActive(undefined)).toBe(false);
    expect(isDemoActive({ enabled: false })).toBe(false);
    expect(isDemoActive({ enabled: true })).toBe(true);
  });

  it("computes remaining cooldown seconds correctly", () => {
    const baseNow = new Date("2026-10-31T12:00:00.000Z");

    // No reset timestamp
    expect(computeCooldownRemaining(null, baseNow)).toBe(0);
    expect(computeCooldownRemaining(undefined, baseNow)).toBe(0);

    // Reset happened 20 seconds ago -> 40 seconds remaining
    const reset20sAgo = new Date(baseNow.getTime() - 20 * 1000);
    expect(computeCooldownRemaining(reset20sAgo, baseNow)).toBe(40);

    // Reset happened 75 seconds ago -> 0 remaining (expired)
    const reset75sAgo = new Date(baseNow.getTime() - 75 * 1000);
    expect(computeCooldownRemaining(reset75sAgo, baseNow)).toBe(0);

    // Handles ISO string input
    expect(computeCooldownRemaining(reset20sAgo.toISOString(), baseNow)).toBe(40);
  });

  it("formats cooldown badge text", () => {
    expect(formatCooldownBadge(0)).toBe("Available");
    expect(formatCooldownBadge(-5)).toBe("Available");
    expect(formatCooldownBadge(30)).toBe("Wait (30s)");
  });

  it("formats reset button text with states", () => {
    expect(formatResetButtonText(0, false)).toBe("Load Sample Data");
    expect(formatResetButtonText(25, false)).toBe("Load Sample Data (25s)");
    expect(formatResetButtonText(25, true)).toBe("Resetting data...");
  });
});
