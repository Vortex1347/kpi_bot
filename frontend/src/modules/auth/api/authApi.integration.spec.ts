import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { ApiError } from "../../../shared/api/http";
import { server } from "../../../../test/msw/server";
import { login, logout, refresh, register } from "./authApi";

describe("authApi integration (MSW)", () => {
  it("login returns access token from API", async () => {
    server.use(
      http.post("http://localhost:3000/auth/login", async ({ request }) => {
        const body = (await request.json()) as { identifier: string; password: string };
        if (body.identifier !== "dev_supervisor") {
          return HttpResponse.json({ message: "Invalid credentials" }, { status: 401 });
        }
        return HttpResponse.json({ accessToken: "integration-token" });
      })
    );

    const result = await login({ identifier: "dev_supervisor", password: "dev_password_change_me" });
    expect(result).toEqual({ accessToken: "integration-token" });
  });

  it("login maps backend error to ApiError", async () => {
    server.use(
      http.post("http://localhost:3000/auth/login", async () =>
        HttpResponse.json({ message: "Invalid credentials" }, { status: 401 })
      )
    );

    await expect(login({ identifier: "unknown", password: "bad_password" })).rejects.toMatchObject<ApiError>({
      status: 401,
      message: "Invalid credentials"
    });
  });

  it("covers register/refresh/logout endpoints", async () => {
    server.use(
      http.post("http://localhost:3000/auth/register", () => HttpResponse.json({ accessToken: "register-token" })),
      http.post("http://localhost:3000/auth/refresh", () => HttpResponse.json({ accessToken: "refresh-token" })),
      http.post("http://localhost:3000/auth/logout", () => HttpResponse.json({ ok: true }))
    );

    await expect(register({ email: "new@example.com", password: "password123" })).resolves.toEqual({
      accessToken: "register-token"
    });
    await expect(refresh()).resolves.toEqual({ accessToken: "refresh-token" });
    await expect(logout()).resolves.toEqual({ ok: true });
  });
});
