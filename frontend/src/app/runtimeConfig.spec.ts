import { beforeEach, describe, expect, it, vi } from "vitest";

describe("runtimeConfig", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("reads api base url from env", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com");

    const { runtimeConfig } = await import("./runtimeConfig");
    expect(runtimeConfig.apiBaseUrl).toBe("https://api.example.com");
  });

  it("falls back to localhost api url when env is absent", async () => {
    vi.unstubAllEnvs();

    const { runtimeConfig } = await import("./runtimeConfig");
    expect(runtimeConfig.apiBaseUrl).toBe("http://localhost:3000");
  });
});
