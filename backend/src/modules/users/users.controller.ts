import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "../auth/auth.service";
import { CrmUserRole } from "../auth/auth.types";

interface CreateUserBody {
  readonly email?: string;
  readonly username?: string;
  readonly password?: string;
  readonly name?: string;
  readonly role?: CrmUserRole;
  readonly isActive?: boolean;
}

interface UpdateUserBody {
  readonly email?: string;
  readonly username?: string;
  readonly password?: string;
  readonly name?: string;
  readonly role?: CrmUserRole;
  readonly isActive?: boolean;
}

@Controller("users")
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @Get("me")
  getMe(@Req() request: Request) {
    return this.authService.getMeFromAuthorizationHeader(request.headers.authorization);
  }

  @Get()
  listUsers(@Req() request: Request) {
    this.authService.requireSupervisorFromAuthorizationHeader(request.headers.authorization);
    return this.authService.listUsers();
  }

  @Post()
  createUser(@Req() request: Request, @Body() body: CreateUserBody) {
    this.authService.requireSupervisorFromAuthorizationHeader(request.headers.authorization);
    if (!body.email?.trim() || !body.password?.trim()) {
      throw new BadRequestException("email и password обязательны.");
    }
    return this.authService.createUser({
      email: body.email,
      username: body.username,
      password: body.password,
      name: body.name,
      role: body.role,
      isActive: body.isActive
    });
  }

  @Patch(":userId")
  updateUser(@Req() request: Request, @Param("userId") userId: string, @Body() body: UpdateUserBody) {
    this.authService.requireSupervisorFromAuthorizationHeader(request.headers.authorization);
    return this.authService.updateUser(userId, {
      email: body.email,
      username: body.username,
      password: body.password,
      name: body.name,
      role: body.role,
      isActive: body.isActive
    });
  }

  @Delete(":userId")
  deleteUser(@Req() request: Request, @Param("userId") userId: string) {
    const actor = this.authService.requireSupervisorFromAuthorizationHeader(request.headers.authorization);
    this.authService.deleteUser(userId, actor.id);
    return { ok: true };
  }
}

