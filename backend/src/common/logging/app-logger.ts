import { Logger } from "@nestjs/common";

const logger = new Logger("App");

type LogLevel = "info" | "warn" | "error";

interface LogMeta {
  readonly [key: string]: unknown;
}

function write(level: LogLevel, event: string, meta: LogMeta = {}): void {
  const payload = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...meta
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    logger.error(line);
    return;
  }

  if (level === "warn") {
    logger.warn(line);
    return;
  }

  logger.log(line);
}

export const appLogger = {
  info(event: string, meta?: LogMeta): void {
    write("info", event, meta);
  },
  warn(event: string, meta?: LogMeta): void {
    write("warn", event, meta);
  },
  error(event: string, meta?: LogMeta): void {
    write("error", event, meta);
  }
};
