/**
 * Send non-secret UI events to the server log file via /api/log.
 */
export function clientLog(
  level: "info" | "warn" | "error",
  message: string,
  meta?: Record<string, unknown>,
): void {
  // Fire-and-forget; failures must not break the UI.
  void fetch("/api/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ level, message, meta }),
  }).catch(() => {
    /* ignore */
  });
}
