import { createElement } from "react";
import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { LoginPage } from "../modules/auth/LoginPage";
import { RegisterPage } from "../modules/auth/RegisterPage";
import { UsersCrmPage } from "../modules/users/pages/UsersCrmPage";
import { LandingPage } from "../modules/landing/pages/LandingPage";
import type { UserRole } from "../modules/users/model/types";
import type { AppKind } from "../app/runtimeConfig";

export interface RouteMeta {
  readonly auth?: boolean;
  readonly permission?: UserRole;
  readonly audience?: "landing" | "crm" | "all";
}

export interface AppRoute {
  readonly path: string;
  readonly element: () => ReactElement;
  readonly meta?: RouteMeta;
}

export const appRoutes: AppRoute[] = [
  {
    path: "/",
    element: () => createElement(LandingPage),
    meta: { auth: false, audience: "landing" }
  },
  {
    path: "/login",
    element: () => createElement(LoginPage),
    meta: { auth: false, audience: "crm" }
  },
  {
    path: "/register",
    element: () => createElement(RegisterPage),
    meta: { auth: false, audience: "crm" }
  },
  {
    path: "/app",
    element: () => createElement(Navigate, { to: "/crm", replace: true }),
    meta: { auth: true, audience: "crm" }
  },
  {
    path: "/crm",
    element: () => createElement(UsersCrmPage),
    meta: { auth: true, audience: "crm" }
  }
];

export function getRoutesForAppKind(appKind: AppKind): AppRoute[] {
  if (appKind === "full") return appRoutes;

  return appRoutes.filter((route) => {
    const audience = route.meta?.audience ?? "all";
    if (audience === "all") return true;
    return audience === appKind;
  });
}
