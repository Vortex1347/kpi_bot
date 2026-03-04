import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "../router/RequireAuth";
import { getRoutesForAppKind } from "../router/routes";
import { useAuthStore } from "../modules/auth/authStore";
import { Layout } from "../shared/ui/Layout";
import { runtimeConfig } from "./runtimeConfig";

export const App = () => {
  const init = useAuthStore((s) => s.init);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const appRoutes = getRoutesForAppKind(runtimeConfig.appKind);
  const fallbackPath = runtimeConfig.appKind === "crm" ? "/crm" : "/";
  const postAuthPath =
    runtimeConfig.appKind === "crm" ? "/crm" : user?.role === "SUPERVISOR" ? "/crm" : "/";

  useEffect(() => {
    if (runtimeConfig.appKind === "landing") return;
    init().catch(() => undefined);
  }, [init]);

  return (
    <Routes>
      {appRoutes.map((route) => {
        const isAuthPage = route.path === "/login" || route.path === "/register";

        return (
          <Route
            key={route.path}
            path={route.path}
            element={
              route.meta?.auth ? (
                <Layout auth={{ isAuthenticated, user, logout }}>
                  <RequireAuth meta={route.meta}>{route.element()}</RequireAuth>
                </Layout>
              ) : isAuthenticated && isAuthPage ? (
                <Navigate to={postAuthPath} replace />
              ) : isAuthPage ? (
                route.element()
              ) : (
                <Layout auth={{ isAuthenticated, user, logout }}>{route.element()}</Layout>
              )
            }
          />
        );
      })}
      <Route path="*" element={<Navigate to={fallbackPath} replace />} />
    </Routes>
  );
};
