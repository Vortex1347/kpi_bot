import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../modules/auth/authStore";
import { LoadingState } from "../shared/ui/LoadingState";
import type { RouteMeta } from "./routes";

interface RequireAuthProps {
  readonly meta?: RouteMeta;
  readonly children: ReactElement;
}

export const RequireAuth = ({ meta, children }: RequireAuthProps) => {
  const location = useLocation();
  const hasInitialized = useAuthStore((s) => s.hasInitialized);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const requiresAuth = meta?.auth === true;

  if (!hasInitialized || isLoading) {
    return <LoadingState />;
  }

  if (requiresAuth && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirect: location.pathname + location.search }} />;
  }

  if (meta?.permission && user?.role !== meta.permission) {
    return <Navigate to="/" replace />;
  }

  return children;
};
