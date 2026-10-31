import { describe, it, expect } from "vitest";
import { resolveStatusConfig } from "./status-badge";

describe("resolveStatusConfig", () => {
  it("resolves SEHAT to success variant", () => {
    const config = resolveStatusConfig("SEHAT");
    expect(config.variant).toBe("success");
    expect(config.defaultLabel).toBe("Sehat");
  });

  it("resolves TIPIS to warning variant", () => {
    const config = resolveStatusConfig("TIPIS");
    expect(config.variant).toBe("warning");
    expect(config.defaultLabel).toBe("Tipis");
  });

  it("resolves KRITIS and RUGI to danger variant", () => {
    expect(resolveStatusConfig("KRITIS").variant).toBe("danger");
    expect(resolveStatusConfig("RUGI").variant).toBe("danger");
  });

  it("resolves INCOMPLETE to neutral variant", () => {
    const config = resolveStatusConfig("INCOMPLETE");
    expect(config.variant).toBe("neutral");
    expect(config.defaultLabel).toBe("Belum Lengkap");
  });

  it("resolves stock status AMAN, SEGARA, KEDALUWARSA", () => {
    expect(resolveStatusConfig("AMAN").variant).toBe("success");
    expect(resolveStatusConfig("SEGERA").variant).toBe("warning");
    expect(resolveStatusConfig("KEDALUWARSA").variant).toBe("danger");
  });

  it("respects explicit variant parameter", () => {
    const config = resolveStatusConfig("custom", "info");
    expect(config.variant).toBe("info");
    expect(config.defaultLabel).toBe("custom");
  });

  it("defaults to neutral for null or unknown", () => {
    expect(resolveStatusConfig(null).variant).toBe("neutral");
    expect(resolveStatusConfig("UNKNOWN").variant).toBe("neutral");
  });
});
