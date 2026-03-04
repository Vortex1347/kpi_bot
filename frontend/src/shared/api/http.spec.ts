import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, fetchJson } from "./http";

describe("fetchJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed json on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({ ok: true }),
        text: async () => ""
      }))
    );

    await expect(fetchJson<{ ok: boolean }>("/health")).resolves.toEqual({ ok: true });
  });

  it("throws ApiError with fallback message for non-json errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        headers: { get: () => "text/plain" },
        json: async () => {
          throw new Error("no json");
        },
        text: async () => "Internal error"
      }))
    );

    await expect(fetchJson("/health")).rejects.toBeInstanceOf(ApiError);
    await expect(fetchJson("/health")).rejects.toMatchObject({ message: "API error", status: 500 });
  });
});
