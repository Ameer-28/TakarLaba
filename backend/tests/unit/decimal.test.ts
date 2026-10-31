import { describe, it, expect } from "vitest";
import { decimalInput } from "../../src/validation/decimal.js";

describe("decimalInput helper", () => {
  it("validates positive numbers and strings", () => {
    const schema = decimalInput({ positive: true });
    expect(schema.safeParse(10).success).toBe(true);
    expect(schema.safeParse("10.5").success).toBe(true);
    expect(schema.safeParse(0).success).toBe(false);
    expect(schema.safeParse(-5).success).toBe(false);
    expect(schema.safeParse("abc").success).toBe(false);
  });

  it("validates ranges with min and max", () => {
    const schema = decimalInput({ min: 0, max: 95 });
    expect(schema.safeParse(0).success).toBe(true);
    expect(schema.safeParse("45.5").success).toBe(true);
    expect(schema.safeParse(95).success).toBe(true);
    expect(schema.safeParse(95.01).success).toBe(false);
    expect(schema.safeParse(-0.01).success).toBe(false);
  });

  it("handles allowEmpty correctly", () => {
    const withEmpty = decimalInput({ min: 0, max: 100, allowEmpty: true });
    expect(withEmpty.safeParse("").success).toBe(true);
    expect(withEmpty.safeParse("   ").success).toBe(true);

    const withoutEmpty = decimalInput({ min: 0, max: 100, allowEmpty: false });
    expect(withoutEmpty.safeParse("").success).toBe(false);
  });

  it("returns custom error message", () => {
    const schema = decimalInput({ positive: true, error: "Custom decimal error" });
    const res = schema.safeParse(-1);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toBe("Custom decimal error");
    }
  });
});
