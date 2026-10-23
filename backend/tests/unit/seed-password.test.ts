import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getDemoPassword, getDemoUsers } from "../../src/seed/index.js";

describe("Seed Password Configuration", () => {
  const originalEnv = process.env.DEMO_PASSWORD;

  beforeEach(() => {
    delete process.env.DEMO_PASSWORD;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.DEMO_PASSWORD = originalEnv;
    } else {
      delete process.env.DEMO_PASSWORD;
    }
  });

  it("throws descriptive error when DEMO_PASSWORD is not set", () => {
    expect(() => getDemoPassword()).toThrowError(
      "DEMO_PASSWORD environment variable is required to run seed"
    );
  });

  it("throws descriptive error when DEMO_PASSWORD is empty string", () => {
    process.env.DEMO_PASSWORD = "   ";
    expect(() => getDemoPassword()).toThrowError(
      "DEMO_PASSWORD environment variable is required to run seed"
    );
  });

  it("returns demo password and builds users when set", () => {
    process.env.DEMO_PASSWORD = "ValidSecret123!";
    expect(getDemoPassword()).toBe("ValidSecret123!");
    const users = getDemoUsers("ValidSecret123!");
    expect(users).toHaveLength(2);
    expect(users[0]?.password).toBe("ValidSecret123!");
    expect(users[1]?.password).toBe("ValidSecret123!");
  });
});
