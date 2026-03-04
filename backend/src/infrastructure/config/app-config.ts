export interface AppConfig {
  readonly apiPort: number;
  readonly leadTelegramId: string;
  readonly telegramBotToken: string;
  readonly reportOutputDir: string;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const appConfig: AppConfig = {
  apiPort: Number.parseInt(process.env.API_PORT ?? "3000", 10) || 3000,
  leadTelegramId: requireEnv("LEAD_TELEGRAM_ID"),
  telegramBotToken: requireEnv("TELEGRAM_BOT_TOKEN"),
  reportOutputDir: process.env.REPORT_OUTPUT_DIR?.trim() || "reports"
};
