import { create } from "zustand";
import * as authApi from "./api/authApi";
import * as usersApi from "../users/api/usersApi";
import type { UserSummary } from "../users/model/types";

interface AuthState {
  readonly accessToken: string | null;
  readonly isAuthenticated: boolean;
  readonly hasInitialized: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly user: UserSummary | null;

  readonly init: () => Promise<void>;
  readonly register: (payload: authApi.RegisterRequest) => Promise<void>;
  readonly login: (payload: authApi.LoginRequest) => Promise<void>;
  readonly logout: () => Promise<void>;
}

function toMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message);
  return "Неизвестная ошибка";
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  isAuthenticated: false,
  hasInitialized: false,
  isLoading: false,
  error: null,
  user: null,

  init: async () => {
    if (get().hasInitialized) return;
    set({ isLoading: true, error: null, hasInitialized: true });
    try {
      const { accessToken } = await authApi.refresh();
      const user = await usersApi.getMe(accessToken);
      set({ accessToken, isAuthenticated: true, user, isLoading: false });
    } catch {
      set({ accessToken: null, isAuthenticated: false, user: null, isLoading: false });
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = await authApi.register(payload);
      const user = await usersApi.getMe(accessToken);
      set({ accessToken, isAuthenticated: true, user, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: toMessage(error) });
      throw error;
    }
  },

  login: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = await authApi.login(payload);
      const user = await usersApi.getMe(accessToken);
      set({ accessToken, isAuthenticated: true, user, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: toMessage(error) });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await authApi.logout();
    } finally {
      set({ accessToken: null, isAuthenticated: false, user: null, isLoading: false });
    }
  }
}));
