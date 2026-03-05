import { type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./Button";
import { ksClasses } from "../design/tokens";

interface LayoutUserInfo {
  readonly username: string;
  readonly role: string;
  readonly email: string;
}

interface LayoutAuthState {
  readonly isAuthenticated: boolean;
  readonly user: LayoutUserInfo | null;
  readonly logout: () => Promise<void>;
}

interface LayoutProps {
  readonly children: ReactNode;
  readonly auth?: LayoutAuthState;
}

export const Layout = ({ children, auth }: LayoutProps) => {
  const navigate = useNavigate();
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const user = auth?.user ?? null;

  return (
    <div className={ksClasses.page}>
      <div className={ksClasses.appContainer}>
        <header className={`mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${ksClasses.card}`}>
          <div className="flex items-center gap-3">
            <Link className="text-sm font-semibold tracking-wide text-primary-400" to="/results">
              KPI CRM
            </Link>
            <nav className="flex items-center gap-2 text-sm text-text-muted">
              {isAuthenticated && user?.role === "SUPERVISOR" ? (
                <Link className="rounded px-2 py-1 hover:bg-surface-2 hover:text-text" to="/crm">
                  CRM
                </Link>
              ) : null}

              {isAuthenticated ? (
                <Link className="rounded px-2 py-1 hover:bg-surface-2 hover:text-text" to="/results">
                  Results
                </Link>
              ) : null}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <div className="text-right text-xs text-text-muted">
                  <div className="font-medium text-text">
                    @{user.username} · {user.role}
                  </div>
                  <div className="text-text-muted">{user.email}</div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (!auth?.logout) return;
                    auth.logout().then(() => navigate("/login")).catch(() => undefined);
                  }}
                >
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Link className="text-sm text-text-muted hover:text-text" to="/login">
                  Вход
                </Link>
                <Link className="text-sm text-text-muted hover:text-text" to="/register">
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-8 border-t border-border pt-4 text-xs text-text-muted">
          KPI CRM Dashboard
        </footer>
      </div>
    </div>
  );
};
