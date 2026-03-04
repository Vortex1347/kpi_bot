const WEAK_MARKERS = ["change_me", "please_change_me", "replace_me", "example"];

function isWeak(value: string | undefined): boolean {
  if (!value) return true;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;

  return WEAK_MARKERS.some((marker) => normalized.includes(marker));
}

export function assertProductionSecurityConfig(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const leadTelegramId = process.env.LEAD_TELEGRAM_ID;
  const databaseUrl = process.env.DATABASE_URL;

  if (isWeak(botToken)) {
    throw new Error("Production TELEGRAM_BOT_TOKEN is missing or weak.");
  }

  if (isWeak(leadTelegramId)) {
    throw new Error("Production LEAD_TELEGRAM_ID is missing or weak.");
  }

  if (isWeak(databaseUrl)) {
    throw new Error("Production DATABASE_URL is missing or weak.");
  }
}
