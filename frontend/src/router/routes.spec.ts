import { describe, expect, it } from "vitest";
import { getAppRoutes } from "./routes";

function paths(): string[] {
  return getAppRoutes().map((route) => route.path);
}

describe("getAppRoutes", () => {
  it("returns crm route-set", () => {
    expect(paths()).toEqual(["/", "/login", "/register", "/app", "/crm", "/results"]);
  });

  it("route definitions provide renderable element factories", () => {
    const routes = getAppRoutes();
    for (const route of routes) {
      const element = route.element();
      expect(element).toBeTruthy();
    }
  });

  it("protects results route with auth", () => {
    const resultsRoute = getAppRoutes().find((route) => route.path === "/results");
    expect(resultsRoute?.meta?.auth).toBe(true);
  });
});
