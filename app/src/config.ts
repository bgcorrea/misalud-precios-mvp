import { config as loadEnv } from "dotenv";

loadEnv();

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const APP_CONFIG = {
  port: parseNumber(process.env.PORT, 3000),
  host: process.env.HOST || "0.0.0.0",
  demoAllowAll: String(process.env.DEMO_ALLOW_ALL || "").toLowerCase() === "true",
  csvDefaultSeparator: process.env.CSV_DEFAULT_SEP === ";" ? ";" : ",",
  rateLimitWindowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMax: parseNumber(process.env.RATE_LIMIT_MAX, 100),
};
