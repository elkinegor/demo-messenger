/**
 * Cookie helpers for GREEN-API credentials.
 * Keys are namespaced per messenger so MAX and Telegram do not clash.
 */
import type { GreenCredentials, MessengerKind } from "./types";

const DAYS = 30;

function encode(value: string): string {
  return encodeURIComponent(value);
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function setCookie(name: string, value: string, days = DAYS): void {
  const maxAge = days * 24 * 60 * 60;
  // SameSite=Lax: enough for our first-party SPA; Secure when on HTTPS.
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encode(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function getCookie(name: string): string | null {
  const parts = document.cookie.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (part.startsWith(`${name}=`)) {
      return decode(part.slice(name.length + 1));
    }
  }
  return null;
}

function clearCookie(name: string): void {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function prefix(kind: MessengerKind): string {
  return `dm_${kind}_`;
}

/** Persist credentials in cookies (browser only). */
export function saveCredentials(kind: MessengerKind, creds: GreenCredentials): void {
  const p = prefix(kind);
  setCookie(`${p}apiUrl`, creds.apiUrl.trim().replace(/\/$/, ""));
  setCookie(`${p}idInstance`, creds.idInstance.trim());
  setCookie(`${p}apiTokenInstance`, creds.apiTokenInstance.trim());
}

/** Load credentials; returns null if any field is missing. */
export function loadCredentials(kind: MessengerKind): GreenCredentials | null {
  const p = prefix(kind);
  const apiUrl = getCookie(`${p}apiUrl`);
  const idInstance = getCookie(`${p}idInstance`);
  const apiTokenInstance = getCookie(`${p}apiTokenInstance`);
  if (!apiUrl || !idInstance || !apiTokenInstance) return null;
  return { apiUrl, idInstance, apiTokenInstance };
}

export function clearCredentials(kind: MessengerKind): void {
  const p = prefix(kind);
  clearCookie(`${p}apiUrl`);
  clearCookie(`${p}idInstance`);
  clearCookie(`${p}apiTokenInstance`);
}

export function hasCredentials(kind: MessengerKind): boolean {
  return loadCredentials(kind) !== null;
}
