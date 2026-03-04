import { http, HttpResponse } from "msw";

export const handlers = [
  http.post("http://localhost:3000/auth/login", async () => HttpResponse.json({ accessToken: "token-from-msw" })),
  http.post("http://localhost:3000/auth/register", async () => HttpResponse.json({ accessToken: "registered-token" })),
  http.post("http://localhost:3000/auth/refresh", async () => HttpResponse.json({ accessToken: "refreshed-token" })),
  http.post("http://localhost:3000/auth/logout", async () => HttpResponse.json({ ok: true }))
];
