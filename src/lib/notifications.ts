/**
 * Map GREEN-API notification bodies into chat events.
 */
import type { ChatMessage } from "./types";

export type IncomingNotification = {
  receiptId: number;
  body: {
    typeWebhook?: string;
    timestamp?: number;
    idMessage?: string;
    senderData?: {
      chatId?: string;
      sender?: string;
      chatName?: string;
      senderName?: string;
    };
    messageData?: {
      typeMessage?: string;
      textMessageData?: { textMessage?: string };
      extendedTextMessageData?: { text?: string };
    };
    statusData?: {
      status?: string; // sent | delivered | read | failed
    };
  };
};

export type ParsedEvent =
  | { type: "message"; message: ChatMessage; titleHint?: string }
  | { type: "status"; idMessage: string; status: ChatMessage["status"] }
  | { type: "ignore" };

function extractText(body: IncomingNotification["body"]): string | null {
  const md = body.messageData;
  if (!md) return null;
  if (md.typeMessage === "textMessage" && md.textMessageData?.textMessage) {
    return md.textMessageData.textMessage;
  }
  if (md.typeMessage === "extendedTextMessage" && md.extendedTextMessageData?.text) {
    return md.extendedTextMessageData.text;
  }
  return null;
}

/**
 * Convert one notification into a UI event.
 * Unknown webhooks are ignored (caller still deletes them to drain the queue).
 */
export function parseNotification(n: IncomingNotification): ParsedEvent {
  const t = n.body.typeWebhook || "";
  const chatId = n.body.senderData?.chatId || "";
  const idMessage = n.body.idMessage || `local-${n.receiptId}`;
  const ts = (n.body.timestamp || Math.floor(Date.now() / 1000)) * 1000;
  const titleHint = n.body.senderData?.chatName || n.body.senderData?.senderName;

  if (t === "incomingMessageReceived") {
    const text = extractText(n.body);
    if (!text || !chatId) return { type: "ignore" };
    return {
      type: "message",
      titleHint,
      message: {
        id: idMessage,
        chatId,
        text,
        direction: "in",
        timestamp: ts,
      },
    };
  }

  // Echo of API send — UI already added the bubble; keep for dedupe only.
  if (t === "outgoingAPIMessageReceived" || t === "outgoingMessageReceived") {
    const text = extractText(n.body);
    if (!text || !chatId) return { type: "ignore" };
    return {
      type: "message",
      titleHint,
      message: {
        id: idMessage,
        chatId,
        text,
        direction: "out",
        timestamp: ts,
        status: "sent",
      },
    };
  }

  if (t === "outgoingMessageStatus") {
    const status = n.body.statusData?.status as ChatMessage["status"];
    if (!n.body.idMessage || !status) return { type: "ignore" };
    return { type: "status", idMessage: n.body.idMessage, status };
  }

  return { type: "ignore" };
}
