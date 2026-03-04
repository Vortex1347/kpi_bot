export type UserRole = "SUPERVISOR" | "USER";

export interface UserSummary {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly name: string | null;
  readonly role: UserRole;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface CreateUserRequest {
  readonly email: string;
  readonly username?: string;
  readonly password: string;
  readonly name?: string;
  readonly role?: UserRole;
  readonly isActive?: boolean;
}

export interface UpdateUserRequest {
  readonly email?: string;
  readonly username?: string;
  readonly password?: string;
  readonly name?: string;
  readonly role?: UserRole;
  readonly isActive?: boolean;
}
