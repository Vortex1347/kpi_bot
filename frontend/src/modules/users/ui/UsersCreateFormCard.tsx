import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { FormField } from "../../../shared/ui/FormField";
import { Input } from "../../../shared/ui/Input";
import { Select } from "../../../shared/ui/Select";
import type { UserRole } from "../model/types";

interface UsersCreateFormCardProps {
  readonly email: string;
  readonly username: string;
  readonly name: string;
  readonly password: string;
  readonly role: UserRole;
  readonly isActive: boolean;
  readonly canCreate: boolean;
  readonly isCreating: boolean;
  readonly onEmailChange: (value: string) => void;
  readonly onUsernameChange: (value: string) => void;
  readonly onNameChange: (value: string) => void;
  readonly onPasswordChange: (value: string) => void;
  readonly onRoleChange: (value: UserRole) => void;
  readonly onStatusChange: (value: boolean) => void;
  readonly onCreate: () => Promise<void>;
}

export const UsersCreateFormCard = ({
  email,
  username,
  name,
  password,
  role,
  isActive,
  canCreate,
  isCreating,
  onEmailChange,
  onUsernameChange,
  onNameChange,
  onPasswordChange,
  onRoleChange,
  onStatusChange,
  onCreate
}: UsersCreateFormCardProps) => {
  return (
    <Card className="space-y-4 p-4">
      <h2 className="text-sm font-medium text-text">Создать пользователя</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Email" hint="обязательное">
          <Input value={email} onChange={(e) => onEmailChange(e.target.value)} />
        </FormField>
        <FormField label="Логин" hint="необязательное">
          <Input value={username} onChange={(e) => onUsernameChange(e.target.value)} />
        </FormField>
        <FormField label="Имя" hint="необязательное">
          <Input value={name} onChange={(e) => onNameChange(e.target.value)} />
        </FormField>
        <FormField label="Пароль" hint="мин. 8 символов">
          <Input type="password" value={password} onChange={(e) => onPasswordChange(e.target.value)} />
        </FormField>
        <FormField label="Роль" hint="по умолчанию USER">
          <Select value={role} onChange={(e) => onRoleChange(e.target.value as UserRole)}>
            <option value="USER">USER</option>
            <option value="SUPERVISOR">SUPERVISOR</option>
          </Select>
        </FormField>
        <FormField label="Статус" hint="при создании">
          <Select value={isActive ? "active" : "inactive"} onChange={(e) => onStatusChange(e.target.value === "active")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </FormField>
      </div>
      <Button onClick={() => onCreate().catch(() => undefined)} isLoading={isCreating} disabled={!canCreate}>
        Создать
      </Button>
    </Card>
  );
};
