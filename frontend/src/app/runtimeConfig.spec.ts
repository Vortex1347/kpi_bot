import { beforeEach, describe, expect, it, vi } from "vitest";

describe("runtimeConfig", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("falls back to full app kind for unknown value", async () => {
    vi.stubEnv("VITE_APP_KIND", "unknown");
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");

    const { runtimeConfig } = await import("./runtimeConfig");
    expect(runtimeConfig.appKind).toBe("full");
  });

  it("parses landing app kind and trims URLs", async () => {
    vi.stubEnv("VITE_APP_KIND", "landing");
    vi.stubEnv("VITE_PUBLIC_APP_URL", "https://www.example.com/");
    vi.stubEnv("VITE_CRM_APP_URL", "https://crm.example.com/");

    const { runtimeConfig } = await import("./runtimeConfig");
    expect(runtimeConfig.appKind).toBe("landing");
    expect(runtimeConfig.publicAppUrl).toBe("https://www.example.com");
    expect(runtimeConfig.crmAppUrl).toBe("https://crm.example.com");
  });

  it("buildExternalUrl handles null and relative path", async () => {
    const { buildExternalUrl } = await import("./runtimeConfig");

    expect(buildExternalUrl(null, "/login")).toBe("/login");
    expect(buildExternalUrl("https://crm.example.com", "login")).toBe("https://crm.example.com/login");
  });
});
