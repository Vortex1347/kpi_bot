import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { RequireAuth } from "../router/RequireAuth";
import { getAppRoutes } from "../router/routes";
import { useAuthStore } from "../modules/auth/authStore";
import { Layout } from "../shared/ui/Layout";

export const App = () => {
  const location = useLocation();
  const init = useAuthStore((s) => s.init);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const appRoutes = getAppRoutes();
  const fallbackPath = "/results";
  const postAuthPath = "/results";

  useEffect(() => {
    const isAuthPath = location.pathname === "/login" || location.pathname === "/register";
    if (isAuthPath) return;
    init().catch(() => undefined);
  }, [init, location.pathname]);

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
