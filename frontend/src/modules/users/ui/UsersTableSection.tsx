import { Button } from "../../../shared/ui/Button";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { LoadingState } from "../../../shared/ui/LoadingState";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  TableContainer
} from "../../../shared/ui/Table";
import type { UserSummary } from "../model/types";

interface UsersTableSectionProps {
  readonly users: UserSummary[];
  readonly isLoadingUsers: boolean;
  readonly currentUserId?: string;
  readonly onToggleRole: (user: UserSummary) => Promise<void>;
  readonly onToggleActive: (user: UserSummary) => Promise<void>;
  readonly onDeleteUser: (userId: string) => Promise<void>;
}

export const UsersTableSection = ({
  users,
  isLoadingUsers,
  currentUserId,
  onToggleRole,
  onToggleActive,
  onDeleteUser
}: UsersTableSectionProps) => {
  const handleDelete = async (user: UserSummary) => {
    if (!window.confirm(`Удалить пользователя ${user.username}?`)) return;
    await onDeleteUser(user.id);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-text">Список пользователей</h2>
        <span className="text-xs text-text-muted">{isLoadingUsers ? "Загрузка..." : `${users.length} шт.`}</span>
      </div>

      {isLoadingUsers ? <LoadingState className="px-3 py-4" label="Загрузка пользователей..." /> : null}
      {!isLoadingUsers && users.length === 0 ? (
        <EmptyState title="Пользователей пока нет" description="Создайте первого пользователя через форму выше." />
      ) : null}
      {users.length > 0 ? (
        <TableContainer>
          <DataTable>
            <DataTableHead>
              <DataTableRow>
                <DataTableHeaderCell>Логин</DataTableHeaderCell>
                <DataTableHeaderCell>Email</DataTableHeaderCell>
                <DataTableHeaderCell>Роль</DataTableHeaderCell>
                <DataTableHeaderCell>Статус</DataTableHeaderCell>
                <DataTableHeaderCell>Действия</DataTableHeaderCell>
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {users.map((user) => (
                <DataTableRow key={user.id}>
                  <DataTableCell className="text-text">
                    {user.username}
                    {currentUserId === user.id ? <span className="ml-2 rounded bg-surface-2 px-2 py-0.5 text-xs text-text-muted">you</span> : null}
                  </DataTableCell>
                  <DataTableCell className="text-text-muted">{user.email}</DataTableCell>
                  <DataTableCell className="text-text-muted">{user.role}</DataTableCell>
                  <DataTableCell className="text-text-muted">{user.isActive ? "active" : "inactive"}</DataTableCell>
                  <DataTableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="ghost" onClick={() => onToggleRole(user).catch(() => undefined)}>
                        {user.role === "SUPERVISOR" ? "Сделать USER" : "Сделать SUPERVISOR"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onToggleActive(user).catch(() => undefined)}>
                        {user.isActive ? "Деактивировать" : "Активировать"}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(user).catch(() => undefined)}>
                        Удалить
                      </Button>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </TableContainer>
      ) : null}
    </section>
  );
};
