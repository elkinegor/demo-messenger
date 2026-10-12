/** Messenger product key — each has its own cookies and chat storage. */
export type MessengerKind = "max" | "telegram";

/** GREEN-API credentials kept only in the browser. */
export type GreenCredentials = {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
};

export type ChatMessage = {
  id: string;
  chatId: string;
  text: string;
  direction: "out" | "in";
  timestamp: number;
  status?: "sent" | "delivered" | "read" | "failed";
};

export type ChatThread = {
  chatId: string;
  phone?: string;
  title: string;
  messages: ChatMessage[];
  unread: number;
  updatedAt: number;
};

export type ToastKind = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  kind: ToastKind;
  text: string;
};
