/**
 * File logger for the Express process.
 * Writes to logs/app.log (created on first write). Credentials are never logged.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Project root: server/ in dev (tsx), dist-server/ after build. */
const ROOT = path.resolve(__dirname, "..");
const LOG_DIR = path.join(ROOT, "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");

function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/** Strip secrets from arbitrary strings before writing. */
function redact(text: string): string {
  return text
    .replace(/apiTokenInstance[=:/]\S+/gi, "apiTokenInstance=[REDACTED]")
    .replace(/"apiTokenInstance"\s*:\s*"[^"]*"/gi, '"apiTokenInstance":"[REDACTED]"')
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]");
}

export type LogLevel = "info" | "warn" | "error" | "debug";

export function writeLog(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  ensureLogDir();
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message: redact(message),
    ...(meta ? { meta: JSON.parse(redact(JSON.stringify(meta))) } : {}),
  });
  fs.appendFileSync(LOG_FILE, `${line}\n`, "utf8");
  // Mirror to stdout for journalctl / docker logs.
  const consoleFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  consoleFn(line);
}

export function getLogFilePath(): string {
  return LOG_FILE;
}
