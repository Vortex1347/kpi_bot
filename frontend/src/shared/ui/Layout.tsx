import { type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { buildExternalUrl, runtimeConfig } from "../../app/runtimeConfig";
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
  const isLandingApp = runtimeConfig.appKind === "landing";
  const isCrmApp = runtimeConfig.appKind === "crm";

  const publicUrl = buildExternalUrl(runtimeConfig.publicAppUrl, "/");
  const crmLoginUrl = buildExternalUrl(runtimeConfig.crmAppUrl, "/login");

  return (
    <div className={ksClasses.page}>
      <div className={ksClasses.appContainer}>
        <header className={`mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${ksClasses.card}`}>
          <div className="flex items-center gap-3">
            {isCrmApp ? (
              <a className="text-sm font-semibold tracking-wide text-primary-400" href={publicUrl}>
                Keysoft Junior
              </a>
            ) : (
              <Link className="text-sm font-semibold tracking-wide text-primary-400" to="/">
                Keysoft Junior
              </Link>
            )}
            <nav className="flex items-center gap-2 text-sm text-text-muted">
              {isCrmApp ? (
                <a className="rounded px-2 py-1 hover:bg-surface-2 hover:text-text" href={publicUrl}>
                  Лендинг
                </a>
              ) : (
                <Link className="rounded px-2 py-1 hover:bg-surface-2 hover:text-text" to="/">
                  Лендинг
                </Link>
              )}

              {isLandingApp ? (
                <a className="rounded px-2 py-1 hover:bg-surface-2 hover:text-text" href={crmLoginUrl}>
                  CRM
                </a>
              ) : user?.role === "SUPERVISOR" ? (
                <Link className="rounded px-2 py-1 hover:bg-surface-2 hover:text-text" to="/crm">
                  CRM
                </Link>
              ) : null}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {isLandingApp ? (
              <a className="text-sm text-text-muted hover:text-text" href={crmLoginUrl}>
                Войти в CRM
              </a>
            ) : isAuthenticated && user ? (
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
                    auth.logout().then(() => navigate(isCrmApp ? "/crm" : "/")).catch(() => undefined);
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
          Keysoft Junior · {isLandingApp ? "public site" : isCrmApp ? "crm app" : "industrial SaaS design foundation"}
        </footer>
      </div>
    </div>
  );
};
