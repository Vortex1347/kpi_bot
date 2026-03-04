import { fetchJson } from "../../../shared/api/http";
import type { CreateUserRequest, UpdateUserRequest, UserSummary } from "../model/types";

export async function getMe(accessToken: string): Promise<UserSummary> {
  return fetchJson<UserSummary>("/users/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export async function listUsers(accessToken: string): Promise<UserSummary[]> {
  return fetchJson<UserSummary[]>("/users", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export async function createUser(accessToken: string, payload: CreateUserRequest): Promise<UserSummary> {
  return fetchJson<UserSummary>("/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    json: payload
  });
}

export async function updateUser(accessToken: string, userId: string, payload: UpdateUserRequest): Promise<UserSummary> {
  return fetchJson<UserSummary>(`/users/${userId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    json: payload
  });
}

export async function deleteUser(accessToken: string, userId: string): Promise<{ readonly ok: true }> {
  return fetchJson<{ readonly ok: true }>(`/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}
