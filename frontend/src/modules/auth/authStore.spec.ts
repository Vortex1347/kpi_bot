import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserSummary } from "../users/model/types";

vi.mock("./api/authApi", () => ({
  refresh: vi.fn(),
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn()
}));

vi.mock("../users/api/usersApi", () => ({
  getMe: vi.fn()
}));

import * as authApi from "./api/authApi";
import * as usersApi from "../users/api/usersApi";
import { useAuthStore } from "./authStore";

const baseState = {
  accessToken: null,
  isAuthenticated: false,
  hasInitialized: false,
  isLoading: false,
  error: null,
  user: null
} as const;

const mockUser: UserSummary = {
  id: "u1",
  username: "dev_supervisor",
  email: "dev-supervisor@carcas.local",
  name: "Development Supervisor",
  role: "SUPERVISOR",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z"
};

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState(baseState);
    vi.clearAllMocks();
  });

  it("init authenticates user when refresh and getMe succeed", async () => {
    vi.mocked(authApi.refresh).mockResolvedValue({ accessToken: "token-1" });
    vi.mocked(usersApi.getMe).mockResolvedValue(mockUser);

    await useAuthStore.getState().init();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.username).toBe("dev_supervisor");
    expect(state.hasInitialized).toBe(true);
  });

  it("init does not call refresh twice after initialization", async () => {
    vi.mocked(authApi.refresh).mockResolvedValue({ accessToken: "token-1" });
    vi.mocked(usersApi.getMe).mockResolvedValue(mockUser);

    await useAuthStore.getState().init();
    await useAuthStore.getState().init();

    expect(authApi.refresh).toHaveBeenCalledTimes(1);
  });

  it("register authenticates user and clears loading flag", async () => {
    vi.mocked(authApi.register).mockResolvedValue({ accessToken: "register-token" });
    vi.mocked(usersApi.getMe).mockResolvedValue(mockUser);

    await useAuthStore.getState().register({ email: "new@example.com", password: "password123" });

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("register-token");
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it("login authenticates user", async () => {
    vi.mocked(authApi.login).mockResolvedValue({ accessToken: "login-token" });
    vi.mocked(usersApi.getMe).mockResolvedValue(mockUser);

    await useAuthStore.getState().login({ identifier: "dev_supervisor", password: "password123" });

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("login-token");
    expect(state.user?.id).toBe("u1");
  });

  it("login stores error on failure", async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error("Invalid credentials"));

    await expect(
      useAuthStore.getState().login({ identifier: "dev_supervisor", password: "wrongpass" })
    ).rejects.toBeInstanceOf(Error);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe("Invalid credentials");
  });

  it("logout clears auth state even if API throws", async () => {
    useAuthStore.setState({
      ...baseState,
      accessToken: "token-1",
      isAuthenticated: true,
      user: mockUser
    });
    vi.mocked(authApi.logout).mockRejectedValue(new Error("network"));

    await expect(useAuthStore.getState().logout()).rejects.toBeInstanceOf(Error);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it("init falls back to logged-out state on refresh failure", async () => {
    vi.mocked(authApi.refresh).mockRejectedValue(new Error("expired"));

    await useAuthStore.getState().init();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
  });
});
