import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import { appLogger } from "../logging/app-logger";

export const REQUEST_ID_HEADER = "x-request-id";

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = Date.now();
    const requestId = (req.headers[REQUEST_ID_HEADER] as string | undefined)?.trim() || randomUUID();

    res.setHeader(REQUEST_ID_HEADER, requestId);

    appLogger.info("request_started", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      userAgent: req.get("user-agent") ?? null
    });

    res.on("finish", () => {
      appLogger.info("request_finished", {
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt
      });
    });

    next();
  }
}
