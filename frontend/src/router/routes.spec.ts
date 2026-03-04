import { describe, expect, it } from "vitest";
import { getRoutesForAppKind } from "./routes";

function pathsFor(kind: "full" | "landing" | "crm"): string[] {
  return getRoutesForAppKind(kind).map((route) => route.path);
}

describe("getRoutesForAppKind", () => {
  it("returns full route-set for full app", () => {
    expect(pathsFor("full")).toEqual(["/", "/login", "/register", "/app", "/crm"]);
  });

  it("returns only public routes for landing app", () => {
    expect(pathsFor("landing")).toEqual(["/"]);
  });

  it("returns only crm routes for crm app", () => {
    expect(pathsFor("crm")).toEqual(["/login", "/register", "/app", "/crm"]);
  });

  it("route definitions provide renderable element factories", () => {
    const routes = getRoutesForAppKind("full");
    for (const route of routes) {
      const element = route.element();
      expect(element).toBeTruthy();
    }
  });
});
