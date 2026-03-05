import { createElement } from "react";
import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { LoginPage } from "../modules/auth/LoginPage";
import { RegisterPage } from "../modules/auth/RegisterPage";
import { UsersCrmPage } from "../modules/users/pages/UsersCrmPage";
import { ResultsPage } from "../modules/results/pages/ResultsPage";
import type { UserRole } from "../modules/users/model/types";

export interface RouteMeta {
  readonly auth?: boolean;
  readonly permission?: UserRole;
}

export interface AppRoute {
  readonly path: string;
  readonly element: () => ReactElement;
  readonly meta?: RouteMeta;
}

export const appRoutes: AppRoute[] = [
  {
    path: "/",
    element: () => createElement(Navigate, { to: "/results", replace: true }),
    meta: { auth: true }
  },
  {
    path: "/login",
    element: () => createElement(LoginPage),
    meta: { auth: false }
  },
  {
    path: "/register",
    element: () => createElement(RegisterPage),
    meta: { auth: false }
  },
  {
    path: "/app",
    element: () => createElement(Navigate, { to: "/crm", replace: true }),
    meta: { auth: true }
  },
  {
    path: "/crm",
    element: () => createElement(UsersCrmPage),
    meta: { auth: true }
  },
  {
    path: "/results",
    element: () => createElement(ResultsPage),
    meta: { auth: true }
  }
];

export function getAppRoutes(): AppRoute[] {
  return appRoutes;
}
