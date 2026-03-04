import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../shared/ui/AuthLayout";
import { Card } from "../../shared/ui/Card";
import { ErrorState } from "../../shared/ui/ErrorState";
import { FormField } from "../../shared/ui/FormField";
import { Input } from "../../shared/ui/Input";
import { Button } from "../../shared/ui/Button";
import { useAuthStore } from "./authStore";

export const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit = useMemo(() => identifier.trim().length > 0 && password.length >= 8, [identifier, password]);

  return (
    <AuthLayout>
      <div className="w-full space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Вход</h1>
          <p className="text-sm text-text-muted">
            Нет аккаунта?{" "}
            <Link className="text-primary-400 hover:text-primary-300" to="/register">
              Зарегистрироваться
            </Link>
          </p>
        </header>

        <Card
          as="form"
          className="space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            login({ identifier, password })
              .then(() => navigate("/"))
              .catch(() => undefined);
          }}
        >
          <FormField label="Email или логин" hint="обязательное">
            <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="your-login или you@example.com" />
          </FormField>

          <FormField label="Пароль" hint="мин. 8 символов">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              type="password"
              autoComplete="current-password"
            />
          </FormField>

          {error ? <ErrorState message={error} /> : null}

          <div className="pt-2">
            <Button type="submit" className="w-full" isLoading={isLoading} disabled={!canSubmit}>
              Войти
            </Button>
          </div>
        </Card>
      </div>
    </AuthLayout>
  );
};
