import { fetchJson } from "../../../shared/api/http";

export interface AuthResponse {
  readonly accessToken: string;
}

export interface RegisterRequest {
  readonly email: string;
  readonly username?: string;
  readonly password: string;
  readonly name?: string;
}

export interface LoginRequest {
  readonly identifier: string;
  readonly password: string;
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  return fetchJson<AuthResponse>("/auth/register", { method: "POST", json: payload });
}

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  return fetchJson<AuthResponse>("/auth/login", { method: "POST", json: payload });
}

export async function refresh(): Promise<AuthResponse> {
  return fetchJson<AuthResponse>("/auth/refresh", { method: "POST" });
}

export async function logout(): Promise<{ readonly ok: true }> {
  return fetchJson<{ ok: true }>("/auth/logout", { method: "POST" });
}
