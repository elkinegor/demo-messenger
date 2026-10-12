/**
 * Browser client for GREEN-API via our Express proxy.
 * Credentials are sent as headers (loaded from cookies by the caller).
 */
import type { GreenCredentials } from "./types";

export class GreenApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "GreenApiError";
    this.status = status;
  }
}

function credHeaders(creds: GreenCredentials): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-api-url": creds.apiUrl,
    "x-id-instance": creds.idInstance,
    "x-api-token": creds.apiTokenInstance,
  };
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
  path: string,
  creds: GreenCredentials,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { ...credHeaders(creds), ...(init?.headers || {}) },
  });
  const data = (await parseJson(res)) as T & { error?: string; detail?: string };
  if (!res.ok) {
    const msg = data?.error || data?.detail || `HTTP ${res.status}`;
    throw new GreenApiError(String(msg), res.status);
  }
  return data as T;
}

export async function getStateInstance(
  creds: GreenCredentials,
): Promise<{ stateInstance: string }> {
  return request("/api/green/getStateInstance", creds);
}

export async function sendMessage(
  creds: GreenCredentials,
  chatId: string,
  message: string,
): Promise<{ idMessage: string }> {
  return request("/api/green/sendMessage", creds, {
    method: "POST",
    body: JSON.stringify({ chatId, message }),
  });
}

export async function receiveNotification(
  creds: GreenCredentials,
  receiveTimeout = 5,
): Promise<null | { receiptId: number; body: Record<string, unknown> }> {
  const data = await request<null | { receiptId: number; body: Record<string, unknown> }>(
    `/api/green/receiveNotification?receiveTimeout=${receiveTimeout}`,
    creds,
  );
  // Empty queue → GREEN-API may return null or {}.
  if (!data || !(data as { receiptId?: number }).receiptId) return null;
  return data as { receiptId: number; body: Record<string, unknown> };
}

export async function deleteNotification(
  creds: GreenCredentials,
  receiptId: number,
): Promise<void> {
  await request(`/api/green/deleteNotification/${receiptId}`, creds, {
    method: "DELETE",
  });
}

/** MAX: resolve phone → numeric chatId. */
export async function checkAccount(
  creds: GreenCredentials,
  phoneNumber: string,
): Promise<{ exists: boolean; chatId?: string }> {
  return request("/api/green/checkAccount", creds, {
    method: "POST",
    body: JSON.stringify({ phoneNumber: Number(phoneNumber) || phoneNumber }),
  });
}
