export type AppKind = "full" | "landing" | "crm";

function parseAppKind(raw: string | undefined): AppKind {
  if (raw === "landing" || raw === "crm" || raw === "full") {
    return raw;
  }

  return "full";
}

function trimUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export const runtimeConfig = {
  appKind: parseAppKind(import.meta.env.VITE_APP_KIND as string | undefined),
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:3000",
  publicAppUrl: trimUrl(import.meta.env.VITE_PUBLIC_APP_URL as string | undefined),
  crmAppUrl: trimUrl(import.meta.env.VITE_CRM_APP_URL as string | undefined)
} as const;

export function buildExternalUrl(baseUrl: string | null, path: string): string {
  if (!baseUrl) return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
