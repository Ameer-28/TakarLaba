import { describe, it, expect } from "vitest";
import { calculateQuickCashOptions } from "./pos-utils";

describe("calculateQuickCashOptions", () => {
  it("includes exact total amount (uang pas) as first option", () => {
    const options = calculateQuickCashOptions(15000);
    expect(options[0]).toBe(15000);
  });

  it("suggests round denominations higher than total", () => {
    const options = calculateQuickCashOptions(17500);
    expect(options).toContain(17500);
    expect(options).toContain(20000);
    expect(options).toContain(50000);
  });

  it("limits result to at most 4 options", () => {
    const options = calculateQuickCashOptions(7500);
    expect(options.length).toBeLessThanOrEqual(4);
  });
});
