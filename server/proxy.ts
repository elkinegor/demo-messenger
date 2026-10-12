/**
 * GREEN-API HTTP proxy.
 * Credentials arrive per-request from the browser (headers) and are not stored.
 */
import type { Request, Response } from "express";
import { writeLog } from "./logger.js";

const ALLOWED_METHODS = new Set([
  "getStateInstance",
  "sendMessage",
  "receiveNotification",
  "deleteNotification",
  "checkAccount",
]);

export type CredHeaders = {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
};

/** Read and validate credentials from custom headers. */
export function readCreds(req: Request): CredHeaders | null {
  const apiUrl = String(req.header("x-api-url") || "").trim().replace(/\/$/, "");
  const idInstance = String(req.header("x-id-instance") || "").trim();
  const apiTokenInstance = String(req.header("x-api-token") || "").trim();
  if (!apiUrl || !idInstance || !apiTokenInstance) return null;
  try {
    const u = new URL(apiUrl);
    if (u.protocol !== "https:") return null;
  } catch {
    return null;
  }
  return { apiUrl, idInstance, apiTokenInstance };
}

function buildGreenUrl(creds: CredHeaders, method: string, extraPath = "", query = ""): string {
  const base = `${creds.apiUrl}/waInstance${creds.idInstance}/${method}/${creds.apiTokenInstance}`;
  return `${base}${extraPath}${query}`;
}

/** Proxy a GREEN-API call; logs method + status without secrets. */
export async function proxyGreenApi(
  req: Request,
  res: Response,
  opts: {
    methodName: string;
    httpMethod: "GET" | "POST" | "DELETE";
    extraPath?: string;
    query?: string;
    body?: unknown;
  },
): Promise<void> {
  const creds = readCreds(req);
  if (!creds) {
    writeLog("warn", "proxy.missing_creds", { method: opts.methodName });
    res.status(401).json({ error: "Missing or invalid GREEN-API credentials" });
    return;
  }
  if (!ALLOWED_METHODS.has(opts.methodName)) {
    res.status(400).json({ error: "Method not allowed" });
    return;
  }

  const url = buildGreenUrl(creds, opts.methodName, opts.extraPath || "", opts.query || "");
  const started = Date.now();

  try {
    const upstream = await fetch(url, {
      method: opts.httpMethod,
      headers: opts.body ? { "Content-Type": "application/json" } : undefined,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

    const text = await upstream.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text.slice(0, 500) };
      }
    }

    writeLog("info", "proxy.ok", {
      method: opts.methodName,
      status: upstream.status,
      ms: Date.now() - started,
      idInstance: creds.idInstance,
    });

    res.status(upstream.status).json(data === null ? {} : data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upstream error";
    writeLog("error", "proxy.fail", {
      method: opts.methodName,
      error: message,
      ms: Date.now() - started,
      idInstance: creds.idInstance,
    });
    res.status(502).json({ error: "GREEN-API unreachable", detail: message });
  }
}
