import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { randomBytes, randomUUID } from "crypto";
import { CrmUserRecord, CrmUserRole, CrmUserSummary } from "./auth.types";

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface TokenSession {
  readonly userId: string;
  readonly expiresAt: number;
}

interface RegisterPayload {
  readonly email: string;
  readonly password: string;
  readonly username?: string;
  readonly name?: string;
}

interface CreateUserPayload {
  readonly email: string;
  readonly password: string;
  readonly username?: string;
  readonly name?: string;
  readonly role?: CrmUserRole;
  readonly isActive?: boolean;
}

interface UpdateUserPayload {
  readonly email?: string;
  readonly username?: string;
  readonly password?: string;
  readonly name?: string;
  readonly role?: CrmUserRole;
  readonly isActive?: boolean;
}

interface LoginResult {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: CrmUserSummary;
}

interface RefreshResult {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: CrmUserSummary;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

function ensurePassword(value: string): string {
  const normalized = value.trim();
  if (normalized.length < 8) {
    throw new BadRequestException("Пароль должен быть не короче 8 символов.");
  }
  return normalized;
}

function ensureEmail(value: string): string {
  const normalized = normalizeEmail(value);
  if (!normalized || !normalized.includes("@")) {
    throw new BadRequestException("Некорректный email.");
  }
  return normalized;
}

function ensureOptionalString(value?: string): string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

@Injectable()
export class AuthService {
  private readonly users = new Map<string, CrmUserRecord>();
  private readonly accessTokens = new Map<string, TokenSession>();
  private readonly refreshTokens = new Map<string, TokenSession>();

  constructor() {
    const supervisorEmail = normalizeEmail(process.env.CRM_SUPERVISOR_EMAIL ?? "supervisor@example.com");
    const supervisorUsername = normalizeUsername(process.env.CRM_SUPERVISOR_USERNAME ?? "dev_supervisor");
    const supervisorPassword = ensurePassword(process.env.CRM_SUPERVISOR_PASSWORD ?? "dev_password_change_me");
    const supervisorName = ensureOptionalString(process.env.CRM_SUPERVISOR_NAME) ?? "Supervisor";
    const now = new Date();
    const id = randomUUID();

    this.users.set(id, {
      id,
      email: supervisorEmail,
      username: supervisorUsername,
      password: supervisorPassword,
      name: supervisorName,
      role: "SUPERVISOR",
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
  }

  login(identifier: string, password: string): LoginResult {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const normalizedPassword = password.trim();
    if (!normalizedIdentifier || !normalizedPassword) {
      throw new BadRequestException("identifier и password обязательны.");
    }

    const user = Array.from(this.users.values()).find(
      (candidate) => candidate.email === normalizedIdentifier || candidate.username === normalizedIdentifier
    );
    if (!user || user.password !== normalizedPassword) {
      throw new UnauthorizedException("Неверный логин или пароль.");
    }
    if (!user.isActive) {
      throw new ForbiddenException("Пользователь деактивирован.");
    }

    const accessToken = this.issueAccessToken(user.id);
    const refreshToken = this.issueRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: this.toUserSummary(user)
    };
  }

  register(payload: RegisterPayload): LoginResult {
    const email = ensureEmail(payload.email);
    const password = ensurePassword(payload.password);
    const username = normalizeUsername(ensureOptionalString(payload.username) ?? email.split("@")[0]);
    const name = ensureOptionalString(payload.name) ?? null;

    this.ensureEmailUnique(email);
    this.ensureUsernameUnique(username);

    const now = new Date();
    const id = randomUUID();
    const user: CrmUserRecord = {
      id,
      email,
      username,
      password,
      name,
      role: "USER",
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);

    const accessToken = this.issueAccessToken(user.id);
    const refreshToken = this.issueRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: this.toUserSummary(user)
    };
  }

  refresh(refreshToken: string): RefreshResult {
    const session = this.consumeSession(this.refreshTokens, refreshToken, "refresh token");
    const user = this.getUserById(session.userId);
    if (!user.isActive) {
      throw new ForbiddenException("Пользователь деактивирован.");
    }

    const nextRefreshToken = this.issueRefreshToken(user.id);
    const accessToken = this.issueAccessToken(user.id);

    return {
      accessToken,
      refreshToken: nextRefreshToken,
      user: this.toUserSummary(user)
    };
  }

  logout(refreshToken?: string): void {
    if (!refreshToken) return;
    this.refreshTokens.delete(refreshToken);
  }

  requireUserFromAuthorizationHeader(authorizationHeader?: string): CrmUserRecord {
    const token = this.extractBearerToken(authorizationHeader);
    const session = this.readSession(this.accessTokens, token, "access token");
    const user = this.getUserById(session.userId);
    if (!user.isActive) {
      throw new ForbiddenException("Пользователь деактивирован.");
    }
    return user;
  }

  requireSupervisorFromAuthorizationHeader(authorizationHeader?: string): CrmUserRecord {
    const user = this.requireUserFromAuthorizationHeader(authorizationHeader);
    if (user.role !== "SUPERVISOR") {
      throw new ForbiddenException("Действие доступно только SUPERVISOR.");
    }
    return user;
  }

  getMeFromAuthorizationHeader(authorizationHeader?: string): CrmUserSummary {
    const user = this.requireUserFromAuthorizationHeader(authorizationHeader);
    return this.toUserSummary(user);
  }

  listUsers(): CrmUserSummary[] {
    return Array.from(this.users.values())
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((user) => this.toUserSummary(user));
  }

  createUser(payload: CreateUserPayload): CrmUserSummary {
    const email = ensureEmail(payload.email);
    const password = ensurePassword(payload.password);
    const username = normalizeUsername(ensureOptionalString(payload.username) ?? email.split("@")[0]);
    const name = ensureOptionalString(payload.name) ?? null;
    const role = payload.role ?? "USER";
    const isActive = payload.isActive ?? true;

    this.ensureEmailUnique(email);
    this.ensureUsernameUnique(username);

    const now = new Date();
    const id = randomUUID();
    const user: CrmUserRecord = {
      id,
      email,
      username,
      password,
      name,
      role,
      isActive,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return this.toUserSummary(user);
  }

  updateUser(userId: string, payload: UpdateUserPayload): CrmUserSummary {
    const existing = this.getUserById(userId);
    const nextEmail = payload.email === undefined ? existing.email : ensureEmail(payload.email);
    const nextUsername =
      payload.username === undefined ? existing.username : normalizeUsername(ensureOptionalString(payload.username) ?? existing.username);

    if (nextEmail !== existing.email) {
      this.ensureEmailUnique(nextEmail, existing.id);
    }
    if (nextUsername !== existing.username) {
      this.ensureUsernameUnique(nextUsername, existing.id);
    }

    const updated: CrmUserRecord = {
      ...existing,
      email: nextEmail,
      username: nextUsername,
      password: payload.password === undefined ? existing.password : ensurePassword(payload.password),
      name: payload.name === undefined ? existing.name : ensureOptionalString(payload.name) ?? null,
      role: payload.role ?? existing.role,
      isActive: payload.isActive ?? existing.isActive,
      updatedAt: new Date()
    };
    this.users.set(existing.id, updated);
    return this.toUserSummary(updated);
  }

  deleteUser(userId: string, actorUserId: string): void {
    if (userId === actorUserId) {
      throw new BadRequestException("Нельзя удалить текущего пользователя.");
    }
    const existing = this.getUserById(userId);
    this.users.delete(existing.id);
  }

  toUserSummary(user: CrmUserRecord): CrmUserSummary {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString()
    };
  }

  private issueAccessToken(userId: string): string {
    const token = this.generateToken("atk");
    this.accessTokens.set(token, {
      userId,
      expiresAt: Date.now() + ACCESS_TOKEN_TTL_MS
    });
    return token;
  }

  private issueRefreshToken(userId: string): string {
    const token = this.generateToken("rtk");
    this.refreshTokens.set(token, {
      userId,
      expiresAt: Date.now() + REFRESH_TOKEN_TTL_MS
    });
    return token;
  }

  private consumeSession(
    sessions: Map<string, TokenSession>,
    token: string,
    tokenType: "access token" | "refresh token"
  ): TokenSession {
    const session = this.readSession(sessions, token, tokenType);
    sessions.delete(token);
    return session;
  }

  private readSession(
    sessions: Map<string, TokenSession>,
    token: string,
    tokenType: "access token" | "refresh token"
  ): TokenSession {
    const session = sessions.get(token);
    if (!session) {
      throw new UnauthorizedException(`Недействительный ${tokenType}.`);
    }
    if (session.expiresAt < Date.now()) {
      sessions.delete(token);
      throw new UnauthorizedException(`Срок действия ${tokenType} истек.`);
    }
    return session;
  }

  private extractBearerToken(header?: string): string {
    if (!header) {
      throw new UnauthorizedException("Требуется Bearer token.");
    }
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Некорректный Authorization header.");
    }
    return token.trim();
  }

  private generateToken(prefix: string): string {
    return `${prefix}_${randomUUID()}_${randomBytes(12).toString("hex")}`;
  }

  private ensureEmailUnique(email: string, skipUserId?: string): void {
    const hasDuplicate = Array.from(this.users.values()).some((user) => user.email === email && user.id !== skipUserId);
    if (hasDuplicate) {
      throw new BadRequestException("Пользователь с таким email уже существует.");
    }
  }

  private ensureUsernameUnique(username: string, skipUserId?: string): void {
    const hasDuplicate = Array.from(this.users.values()).some((user) => user.username === username && user.id !== skipUserId);
    if (hasDuplicate) {
      throw new BadRequestException("Пользователь с таким username уже существует.");
    }
  }

  private getUserById(userId: string): CrmUserRecord {
    const user = this.users.get(userId);
    if (!user) {
      throw new UnauthorizedException("Пользователь не найден.");
    }
    return user;
  }
}

