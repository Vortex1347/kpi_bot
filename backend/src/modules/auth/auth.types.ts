export type CrmUserRole = "SUPERVISOR" | "USER";

export interface CrmUserRecord {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly name: string | null;
  readonly role: CrmUserRole;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly password: string;
}

export interface CrmUserSummary {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly name: string | null;
  readonly role: CrmUserRole;
  readonly isActive: boolean;
  readonly createdAt: string;
}

