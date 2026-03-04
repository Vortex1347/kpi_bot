import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { ErrorState } from "../../../shared/ui/ErrorState";
import { useUsersCrm } from "../model/useUsersCrm";
import { UsersCreateFormCard } from "../ui/UsersCreateFormCard";
import { UsersTableSection } from "../ui/UsersTableSection";

export const UsersCrmPage = () => {
  const {
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
  } = useUsersCrm();

  if (!isSupervisor) {
    return (
      <Card className="space-y-3 p-6">
        <h1 className="text-2xl font-semibold tracking-tight">CRM</h1>
        <p className="text-sm text-text-muted">Раздел доступен только пользователям с ролью supervisor.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CRM: пользователи</h1>
          <p className="text-sm text-text-muted">Управление ролями, статусом и доступом.</p>
        </div>
        <Button variant="secondary" onClick={() => refreshUsers().catch(() => undefined)}>
          Обновить
        </Button>
      </header>

      {usersError ? <ErrorState message={usersError} /> : null}

      <UsersCreateFormCard
        email={newUser.email}
        username={newUser.username ?? ""}
        name={newUser.name ?? ""}
        password={newUser.password}
        role={newUser.role ?? "USER"}
        isActive={newUser.isActive ?? true}
        canCreate={canCreate}
        isCreating={isCreating}
        onEmailChange={setEmail}
        onUsernameChange={setUsername}
        onNameChange={setName}
        onPasswordChange={setPassword}
        onRoleChange={setRole}
        onStatusChange={setIsActive}
        onCreate={createUser}
      />

      <UsersTableSection
        users={users}
        isLoadingUsers={isLoadingUsers}
        currentUserId={currentUser?.id}
        onToggleRole={toggleRole}
        onToggleActive={toggleActive}
        onDeleteUser={deleteUser}
      />
    </div>
  );
};
