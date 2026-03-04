import { appLogger } from "../logging/app-logger";

interface MonitoredErrorPayload {
  readonly event: string;
  readonly statusCode: number;
  readonly path?: string;
  readonly message?: unknown;
  readonly requestId?: string;
}

const ERROR_WEBHOOK_URL = process.env.ERROR_MONITORING_WEBHOOK_URL?.trim();

export function reportError(payload: MonitoredErrorPayload): void {
  if (!ERROR_WEBHOOK_URL) return;

  // Fire-and-forget webhook to external monitoring pipeline.
  void fetch(ERROR_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      source: "kpi-bot-backend",
      ...payload,
      timestamp: new Date().toISOString()
    })
  }).catch((error: unknown) => {
    appLogger.warn("monitoring_webhook_failed", {
      message: error instanceof Error ? error.message : String(error)
    });
  });
}
