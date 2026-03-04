import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../shared/ui/AuthLayout";
import { Card } from "../../shared/ui/Card";
import { ErrorState } from "../../shared/ui/ErrorState";
import { FormField } from "../../shared/ui/FormField";
import { Input } from "../../shared/ui/Input";
import { Button } from "../../shared/ui/Button";
import { useAuthStore } from "./authStore";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit = useMemo(() => email.trim().length > 0 && password.length >= 8, [email, password]);

  return (
    <AuthLayout>
      <div className="w-full space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Регистрация</h1>
          <p className="text-sm text-text-muted">
            Уже есть аккаунт?{" "}
            <Link className="text-primary-400 hover:text-primary-300" to="/login">
              Войти
            </Link>
          </p>
        </header>

        <Card
          as="form"
          className="space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            register({ email, password, username: username.trim() || undefined, name: name.trim() || undefined })
              .then(() => navigate("/"))
              .catch(() => undefined);
          }}
        >
          <FormField label="Имя" hint="необязательное">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" />
          </FormField>

          <FormField label="Логин" hint="необязательное">
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
          </FormField>

          <FormField label="Email" hint="обязательное">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </FormField>

          <FormField label="Пароль" hint="мин. 8 символов">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              type="password"
              autoComplete="new-password"
            />
          </FormField>

          {error ? <ErrorState message={error} /> : null}

          <div className="pt-2">
            <Button type="submit" className="w-full" isLoading={isLoading} disabled={!canSubmit}>
              Создать аккаунт
            </Button>
          </div>
        </Card>
      </div>
    </AuthLayout>
  );
};
