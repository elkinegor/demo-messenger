/**
 * Express entry: GREEN-API proxy, client log intake, static SPA in production.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { getLogFilePath, writeLog } from "./logger.js";
import { proxyGreenApi } from "./proxy.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3210);
const isProd = process.env.NODE_ENV === "production";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "256kb" }));

/** Health for Caddy / deploy checks. */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, logFile: getLogFilePath() });
});

/** Client-side events (toasts, UI errors) — no secrets in body. */
app.post("/api/log", (req, res) => {
  const level = (req.body?.level as string) || "info";
  const message = String(req.body?.message || "client.event");
  const meta = typeof req.body?.meta === "object" ? req.body.meta : undefined;
  writeLog(
    level === "error" || level === "warn" || level === "debug" ? level : "info",
    message,
    meta,
  );
  res.status(204).end();
});

app.get("/api/green/getStateInstance", (req, res) =>
  proxyGreenApi(req, res, { methodName: "getStateInstance", httpMethod: "GET" }),
);

app.post("/api/green/sendMessage", (req, res) =>
  proxyGreenApi(req, res, {
    methodName: "sendMessage",
    httpMethod: "POST",
    body: req.body,
  }),
);

app.get("/api/green/receiveNotification", (req, res) => {
  const timeout = Math.min(60, Math.max(5, Number(req.query.receiveTimeout) || 5));
  return proxyGreenApi(req, res, {
    methodName: "receiveNotification",
    httpMethod: "GET",
    query: `?receiveTimeout=${timeout}`,
  });
});

app.delete("/api/green/deleteNotification/:receiptId", (req, res) =>
  proxyGreenApi(req, res, {
    methodName: "deleteNotification",
    httpMethod: "DELETE",
    extraPath: `/${encodeURIComponent(req.params.receiptId)}`,
  }),
);

app.post("/api/green/checkAccount", (req, res) =>
  proxyGreenApi(req, res, {
    methodName: "checkAccount",
    httpMethod: "POST",
    body: req.body,
  }),
);

if (isProd) {
  const dist = path.resolve(__dirname, "../dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.listen(PORT, "127.0.0.1", () => {
  writeLog("info", "server.start", { port: PORT, prod: isProd });
});
