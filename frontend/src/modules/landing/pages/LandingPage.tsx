import { Card } from "../../../shared/ui/Card";
import { useAuthStore } from "../../auth/authStore";
import { buildExternalUrl, runtimeConfig } from "../../../app/runtimeConfig";

export const LandingPage = () => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const crmLoginUrl = buildExternalUrl(runtimeConfig.crmAppUrl, "/login");
  const crmRegisterUrl = buildExternalUrl(runtimeConfig.crmAppUrl, "/register");
  const crmRootUrl = buildExternalUrl(runtimeConfig.crmAppUrl, "/crm");

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-gradient-to-br from-surface to-bg p-6 shadow-2 sm:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-primary-400">Keysoft Junior</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Industrial SaaS Starter</h1>
        <p className="mt-3 max-w-2xl text-sm text-text-muted">
          Унифицированная база для CRM, micro-SaaS и образовательных приложений: auth, роли, профиль в шапке и supervisor CRM.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          {isAuthenticated ? (
            <>
              <span className="rounded-md border border-border bg-surface-2 px-3 py-2 text-text">
                Вы вошли как <strong>@{user?.username ?? "user"}</strong>
              </span>
              {user?.role === "SUPERVISOR" ? (
                <a className="rounded-md border border-primary-600 bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700" href={crmRootUrl}>
                  Открыть CRM
                </a>
              ) : null}
            </>
          ) : (
            <>
              <a className="rounded-md border border-primary-600 bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700" href={crmLoginUrl}>
                Войти
              </a>
              <a className="rounded-md border border-border bg-surface px-4 py-2 font-semibold text-text hover:bg-surface-2" href={crmRegisterUrl}>
                Регистрация
              </a>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card as="article" className="p-5">
          <h2 className="text-sm font-semibold text-text">Auth</h2>
          <p className="mt-2 text-sm text-text-muted">JWT access/refresh, вход по email или логину.</p>
        </Card>
        <Card as="article" className="p-5">
          <h2 className="text-sm font-semibold text-text">Roles</h2>
          <p className="mt-2 text-sm text-text-muted">Роль SUPERVISOR для админских функций CRM.</p>
        </Card>
        <Card as="article" className="p-5">
          <h2 className="text-sm font-semibold text-text">CRM</h2>
          <p className="mt-2 text-sm text-text-muted">Создание пользователей и управление ролями/статусом.</p>
        </Card>
      </section>
    </div>
  );
};
