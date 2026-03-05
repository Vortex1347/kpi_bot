import { BadRequestException, Body, Controller, HttpCode, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";

const REFRESH_COOKIE_NAME = "crm_refresh_token";
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

interface LoginBody {
  readonly identifier?: string;
  readonly password?: string;
}

interface RegisterBody {
  readonly email?: string;
  readonly password?: string;
  readonly username?: string;
  readonly name?: string;
}

function extractCookie(rawCookieHeader: string | undefined, cookieName: string): string | undefined {
  if (!rawCookieHeader) return undefined;
  const segments = rawCookieHeader.split(";").map((segment) => segment.trim());
  const prefix = `${cookieName}=`;
  const entry = segments.find((segment) => segment.startsWith(prefix));
  if (!entry) return undefined;
  return entry.slice(prefix.length);
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(200)
  login(@Body() body: LoginBody, @Res({ passthrough: true }) response: Response) {
    const identifier = body.identifier?.trim();
    const password = body.password?.trim();
    if (!identifier || !password) {
      throw new BadRequestException("identifier и password обязательны.");
    }

    const result = this.authService.login(identifier, password);
    this.setRefreshCookie(response, result.refreshToken);
    return {
      accessToken: result.accessToken
    };
  }

  @Post("register")
  @HttpCode(200)
  register(@Body() body: RegisterBody, @Res({ passthrough: true }) response: Response) {
    const email = body.email?.trim();
    const password = body.password?.trim();
    if (!email || !password) {
      throw new BadRequestException("email и password обязательны.");
    }

    const result = this.authService.register({
      email,
      password,
      username: body.username,
      name: body.name
    });
    this.setRefreshCookie(response, result.refreshToken);
    return {
      accessToken: result.accessToken
    };
  }

  @Post("refresh")
  @HttpCode(200)
  refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = this.readRefreshToken(request);
    const result = this.authService.refresh(refreshToken);
    this.setRefreshCookie(response, result.refreshToken);
    return {
      accessToken: result.accessToken
    };
  }

  @Post("logout")
  @HttpCode(200)
  logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = extractCookie(request.headers.cookie, REFRESH_COOKIE_NAME);
    this.authService.logout(refreshToken);
    response.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    return { ok: true };
  }

  private readRefreshToken(request: Request): string {
    const token = extractCookie(request.headers.cookie, REFRESH_COOKIE_NAME);
    if (!token) {
      throw new BadRequestException("Refresh token cookie не найден.");
    }
    return token;
  }

  private setRefreshCookie(response: Response, token: string): void {
    response.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
      path: "/"
    });
  }
}
