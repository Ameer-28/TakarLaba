import { describe, it, expect } from "vitest";
import { parseEnv } from "../../src/config/env.js";

describe("parseEnv", () => {
  const baseValid = {
    DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
    BETTER_AUTH_SECRET: "12345678901234567890123456789012",
    BETTER_AUTH_URL: "http://localhost:4000",
    FRONTEND_URL: "http://localhost:5173",
  };

  it("parses DEMO_MODE 'false' as boolean false", () => {
    const res = parseEnv({ ...baseValid, DEMO_MODE: "false" });
    expect(res.DEMO_MODE).toBe(false);
  });

  it("parses DEMO_MODE 'true' as boolean true", () => {
    const res = parseEnv({ ...baseValid, DEMO_MODE: "true" });
    expect(res.DEMO_MODE).toBe(true);
  });

  it("throws when BETTER_AUTH_SECRET is missing", () => {
    expect(() => parseEnv({ ...baseValid, BETTER_AUTH_SECRET: undefined })).toThrow(
      /BETTER_AUTH_SECRET/
    );
  });

  it("throws when BETTER_AUTH_SECRET is shorter than 32 characters", () => {
    expect(() => parseEnv({ ...baseValid, BETTER_AUTH_SECRET: "short-secret" })).toThrow(
      /BETTER_AUTH_SECRET/
    );
  });

  it("aliases DATABASE_URL_UNPOOLED to DIRECT_URL when DIRECT_URL is unset", () => {
    const res = parseEnv({
      ...baseValid,
      DIRECT_URL: undefined,
      DATABASE_URL_UNPOOLED: "postgresql://unpooled:pass@localhost:5432/db",
    });
    expect(res.DIRECT_URL).toBe("postgresql://unpooled:pass@localhost:5432/db");
  });

  it("does not fallback DIRECT_URL to pooled DATABASE_URL when DIRECT_URL and UNPOOLED are unset", () => {
    const res = parseEnv({
      ...baseValid,
      DIRECT_URL: undefined,
      DATABASE_URL_UNPOOLED: undefined,
    });
    expect(res.DIRECT_URL).toBeUndefined();
  });
});
