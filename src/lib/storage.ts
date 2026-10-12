/**
 * Chat history in localStorage — never sent to our server.
 */
import type { ChatThread, MessengerKind } from "./types";

function key(kind: MessengerKind, idInstance: string): string {
  return `dm_chats_${kind}_${idInstance}`;
}

export function loadThreads(kind: MessengerKind, idInstance: string): ChatThread[] {
  try {
    const raw = localStorage.getItem(key(kind, idInstance));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatThread[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveThreads(kind: MessengerKind, idInstance: string, threads: ChatThread[]): void {
  localStorage.setItem(key(kind, idInstance), JSON.stringify(threads));
}
