import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

interface VercelHeaderItem {
  key: string;
  value: string;
}

interface VercelHeaderRule {
  source: string;
  headers: VercelHeaderItem[];
}

interface VercelConfig {
  framework?: string;
  buildCommand?: string;
  outputDirectory?: string;
  rewrites?: Array<{ source: string; destination: string }>;
  headers?: VercelHeaderRule[];
}

describe("frontend vercel.json security headers", () => {
  const vercelJsonPath = resolve(__dirname, "../../vercel.json");
  const rawContent = readFileSync(vercelJsonPath, "utf-8");
  const config = JSON.parse(rawContent) as VercelConfig;

  it("should be valid JSON with headers configuration", () => {
    expect(config).toBeDefined();
    expect(Array.isArray(config.headers)).toBe(true);
    expect(config.headers?.length).toBeGreaterThan(0);
  });

  it("should match all routes with /(.*)", () => {
    const globalRule = config.headers?.find((rule) => rule.source === "/(.*)");
    expect(globalRule).toBeDefined();
  });

  it("should enforce Content-Security-Policy with defensive directives", () => {
    const globalRule = config.headers?.find((rule) => rule.source === "/(.*)");
    const csp = globalRule?.headers.find((h) => h.key.toLowerCase() === "content-security-policy");

    expect(csp).toBeDefined();
    expect(csp?.value).toContain("default-src 'self'");
    expect(csp?.value).toContain("frame-ancestors 'none'");
    expect(csp?.value).toContain("object-src 'none'");
    expect(csp?.value).toContain("base-uri 'self'");
    expect(csp?.value).toContain("form-action 'self'");
  });

  it("should configure anti-clickjacking and nosniff headers", () => {
    const globalRule = config.headers?.find((rule) => rule.source === "/(.*)");
    const frameOptions = globalRule?.headers.find((h) => h.key.toLowerCase() === "x-frame-options");
    const nosniff = globalRule?.headers.find(
      (h) => h.key.toLowerCase() === "x-content-type-options"
    );

    expect(frameOptions?.value).toBe("DENY");
    expect(nosniff?.value).toBe("nosniff");
  });

  it("should enforce Strict-Transport-Security with includeSubDomains and preload", () => {
    const globalRule = config.headers?.find((rule) => rule.source === "/(.*)");
    const hsts = globalRule?.headers.find(
      (h) => h.key.toLowerCase() === "strict-transport-security"
    );

    expect(hsts).toBeDefined();
    expect(hsts?.value).toContain("max-age=");
    expect(hsts?.value).toContain("includeSubDomains");
    expect(hsts?.value).toContain("preload");
  });

  it("should enforce Referrer-Policy and restrictive Permissions-Policy", () => {
    const globalRule = config.headers?.find((rule) => rule.source === "/(.*)");
    const referrer = globalRule?.headers.find((h) => h.key.toLowerCase() === "referrer-policy");
    const permissions = globalRule?.headers.find(
      (h) => h.key.toLowerCase() === "permissions-policy"
    );

    expect(referrer?.value).toBe("strict-origin-when-cross-origin");
    expect(permissions?.value).toContain("camera=()");
    expect(permissions?.value).toContain("microphone=()");
    expect(permissions?.value).toContain("geolocation=()");
  });
});
