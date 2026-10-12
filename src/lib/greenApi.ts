/**
 * Browser client for GREEN-API (direct HTTPS to apiUrl from the user's network).
 *
 * Why not via our Express proxy: the VPS (Singapore) cannot open TCP:443 to
 * GREEN-API hosts (*.api.green-api.com / Yandex). The console works, API does not.
 * The user's browser usually can reach GREEN-API, so calls go from the client.
 * Server still receives non-secret UI logs via /api/log.
 */
import { clientLog } from "./loggerClient";
import type { GreenCredentials } from "./types";

export class GreenApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "GreenApiError";
    this.status = status;
  }
}

/** Build GREEN-API method URL. Method names are case-sensitive on some hosts. */
function greenUrl(
  creds: GreenCredentials,
  method: string,
  extraPath = "",
  query = "",
): string {
  const base = creds.apiUrl.replace(/\/$/, "");
  return `${base}/waInstance${creds.idInstance}/${method}/${creds.apiTokenInstance}${extraPath}${query}`;
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function request<T>(
  creds: GreenCredentials,
  method: string,
  init?: RequestInit & { extraPath?: string; query?: string },
): Promise<T> {
  const { extraPath = "", query = "", ...fetchInit } = init || {};
  const url = greenUrl(creds, method, extraPath, query);
  let res: Response;
  try {
    res = await fetch(url, {
      ...fetchInit,
      headers: {
        ...(fetchInit.body ? { "Content-Type": "application/json" } : {}),
        ...(fetchInit.headers || {}),
      },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    clientLog("error", "green.fetch_failed", {
      method,
      idInstance: creds.idInstance,
      detail,
    });
    throw new GreenApiError(
      `GREEN-API unreachable (${detail}). Check apiUrl and that your network can reach *.api.green-api.com`,
      0,
    );
  }

  const data = (await parseJson(res)) as T & {
    error?: string;
    detail?: string;
    message?: string;
  };
  if (!res.ok) {
    const msg =
      data?.error || data?.detail || data?.message || `HTTP ${res.status}`;
    clientLog("warn", "green.http_error", {
      method,
      status: res.status,
      idInstance: creds.idInstance,
    });
    throw new GreenApiError(String(msg), res.status);
  }
  return data as T;
}

export async function getStateInstance(
  creds: GreenCredentials,
): Promise<{ stateInstance: string }> {
  return request(creds, "getStateInstance", { method: "GET" });
}

export async function sendMessage(
  creds: GreenCredentials,
  chatId: string,
  message: string,
): Promise<{ idMessage: string }> {
  return request(creds, "sendMessage", {
    method: "POST",
    body: JSON.stringify({ chatId, message }),
  });
}

export async function receiveNotification(
  creds: GreenCredentials,
  receiveTimeout = 5,
): Promise<null | { receiptId: number; body: Record<string, unknown> }> {
  const data = await request<null | {
    receiptId: number;
    body: Record<string, unknown>;
  }>(creds, "receiveNotification", {
    method: "GET",
    query: `?receiveTimeout=${receiveTimeout}`,
  });
  if (!data || !(data as { receiptId?: number }).receiptId) return null;
  return data as { receiptId: number; body: Record<string, unknown> };
}

export async function deleteNotification(
  creds: GreenCredentials,
  receiptId: number,
): Promise<void> {
  await request(creds, "deleteNotification", {
    method: "DELETE",
    extraPath: `/${receiptId}`,
  });
}

/** MAX: resolve phone → numeric chatId. */
export async function checkAccount(
  creds: GreenCredentials,
  phoneNumber: string,
): Promise<{ exists: boolean; chatId?: string }> {
  return request(creds, "checkAccount", {
    method: "POST",
    body: JSON.stringify({ phoneNumber: Number(phoneNumber) || phoneNumber }),
  });
}
