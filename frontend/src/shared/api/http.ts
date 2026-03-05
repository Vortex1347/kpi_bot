export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:3000";

type JsonRecord = Record<string, unknown>;

function hasMessage(value: unknown): value is { message: unknown } {
  return typeof value === "object" && value !== null && "message" in value;
}

function resolveApiErrorMessage(body: unknown): string {
  if (!hasMessage(body)) return "API error";

  const direct = body.message;
  if (typeof direct === "string") return direct;
  if (Array.isArray(direct)) return direct.map((item) => String(item)).join(", ");
  if (hasMessage(direct) && typeof direct.message === "string") return direct.message;

  return "API error";
}

export async function fetchJson<TResponse>(
  path: string,
  options?: RequestInit & { readonly json?: JsonRecord }
): Promise<TResponse> {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(options?.headers);

  if (options?.json) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: options?.json ? JSON.stringify(options.json) : options?.body,
    credentials: "include"
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await response.json().catch(() => undefined) : await response.text().catch(() => undefined);

  if (!response.ok) {
    const message = resolveApiErrorMessage(body);
    throw new ApiError(message, response.status, body);
  }

  return body as TResponse;
}
