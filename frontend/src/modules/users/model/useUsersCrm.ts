import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../auth/authStore";
import * as usersApi from "../api/usersApi";
import type { CreateUserRequest, UserRole, UserSummary } from "./types";

const DEFAULT_NEW_USER: CreateUserRequest = {
  email: "",
  password: "",
  username: "",
  name: "",
  role: "USER",
  isActive: true
};

function toMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export const useUsersCrm = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUser = useAuthStore((s) => s.user);

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<CreateUserRequest>(DEFAULT_NEW_USER);
  const [isCreating, setIsCreating] = useState(false);

  const isSupervisor = currentUser?.role === "SUPERVISOR";

  const refreshUsers = useCallback(async () => {
    if (!accessToken || !isSupervisor) return;

    setIsLoadingUsers(true);
    setUsersError(null);
    try {
      const data = await usersApi.listUsers(accessToken);
      setUsers(data);
    } catch (error) {
      setUsersError(toMessage(error, "Не удалось загрузить пользователей"));
    } finally {
      setIsLoadingUsers(false);
    }
  }, [accessToken, isSupervisor]);

  useEffect(() => {
    refreshUsers().catch(() => undefined);
  }, [refreshUsers]);

  const canCreate = useMemo(() => {
    return newUser.email.trim().length > 0 && newUser.password.length >= 8;
  }, [newUser.email, newUser.password]);

  const createUser = useCallback(async () => {
    if (!accessToken || !canCreate) return;

    setIsCreating(true);
    setUsersError(null);
    try {
      await usersApi.createUser(accessToken, {
        email: newUser.email,
        password: newUser.password,
        username: newUser.username?.trim() || undefined,
        name: newUser.name?.trim() || undefined,
        role: newUser.role,
        isActive: newUser.isActive
      });
      setNewUser(DEFAULT_NEW_USER);
      await refreshUsers();
    } catch (error) {
      setUsersError(toMessage(error, "Не удалось создать пользователя"));
    } finally {
      setIsCreating(false);
    }
  }, [accessToken, canCreate, newUser, refreshUsers]);

  const toggleRole = useCallback(
    async (user: UserSummary) => {
      if (!accessToken) return;

      const nextRole: UserRole = user.role === "SUPERVISOR" ? "USER" : "SUPERVISOR";
      try {
        await usersApi.updateUser(accessToken, user.id, { role: nextRole });
        await refreshUsers();
      } catch (error) {
        setUsersError(toMessage(error, "Не удалось обновить роль"));
      }
    },
    [accessToken, refreshUsers]
  );

  const toggleActive = useCallback(
    async (user: UserSummary) => {
      if (!accessToken) return;

      try {
        await usersApi.updateUser(accessToken, user.id, { isActive: !user.isActive });
        await refreshUsers();
      } catch (error) {
        setUsersError(toMessage(error, "Не удалось обновить статус"));
      }
    },
    [accessToken, refreshUsers]
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      if (!accessToken) return;

      try {
        await usersApi.deleteUser(accessToken, userId);
        await refreshUsers();
      } catch (error) {
        setUsersError(toMessage(error, "Не удалось удалить пользователя"));
      }
    },
    [accessToken, refreshUsers]
  );

  const setEmail = (email: string) => setNewUser((prev) => ({ ...prev, email }));
  const setUsername = (username: string) => setNewUser((prev) => ({ ...prev, username }));
  const setName = (name: string) => setNewUser((prev) => ({ ...prev, name }));
  const setPassword = (password: string) => setNewUser((prev) => ({ ...prev, password }));
  const setRole = (role: UserRole) => setNewUser((prev) => ({ ...prev, role }));
  const setIsActive = (isActive: boolean) => setNewUser((prev) => ({ ...prev, isActive }));

  return {
    users,
    isLoadingUsers,
    usersError,
    newUser,
    isCreating,
    canCreate,
    isSupervisor,
    currentUser,
    refreshUsers,
    createUser,
    toggleRole,
    toggleActive,
    deleteUser,
    setEmail,
    setUsername,
    setName,
    setPassword,
    setRole,
    setIsActive
  };
};
