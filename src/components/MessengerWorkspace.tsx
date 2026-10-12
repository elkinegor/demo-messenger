/**
 * Shared chat logic for MAX and Telegram shells (themes via CSS class).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useReceiveLoop } from "../hooks/useReceiveLoop";
import { useI18n } from "../i18n/I18nContext";
import { loadCredentials } from "../lib/cookies";
import { sendMessage } from "../lib/greenApi";
import { clientLog } from "../lib/loggerClient";
import type { ParsedEvent } from "../lib/notifications";
import { loadThreads, saveThreads } from "../lib/storage";
import type {
  ChatMessage,
  ChatThread,
  GreenCredentials,
  MessengerKind,
  ToastItem,
} from "../lib/types";
import { NewChatModal } from "./NewChatModal";
import { SettingsModal } from "./SettingsModal";
import { Spinner } from "./Spinner";
import { ToastStack } from "./Toast";

type Props = {
  kind: MessengerKind;
  /** Extra class for skin: theme-max | theme-telegram */
  themeClass: string;
  brand: string;
};

function upsertMessage(threads: ChatThread[], msg: ChatMessage, titleHint?: string): ChatThread[] {
  const idx = threads.findIndex((t) => t.chatId === msg.chatId);
  const now = Date.now();
  if (idx === -1) {
    return [
      {
        chatId: msg.chatId,
        title: titleHint || msg.chatId,
        messages: [msg],
        unread: msg.direction === "in" ? 1 : 0,
        updatedAt: now,
      },
      ...threads,
    ];
  }
  const copy = [...threads];
  const thread = { ...copy[idx] };
  if (thread.messages.some((m) => m.id === msg.id)) {
    return threads;
  }
  thread.messages = [...thread.messages, msg];
  thread.updatedAt = now;
  if (titleHint && thread.title === thread.chatId) thread.title = titleHint;
  if (msg.direction === "in") thread.unread += 1;
  copy[idx] = thread;
  copy.sort((a, b) => b.updatedAt - a.updatedAt);
  return copy;
}

function applyStatus(
  threads: ChatThread[],
  idMessage: string,
  status: ChatMessage["status"],
): ChatThread[] {
  return threads.map((th) => ({
    ...th,
    messages: th.messages.map((m) => (m.id === idMessage ? { ...m, status } : m)),
  }));
}

export function MessengerWorkspace({ kind, themeClass, brand }: Props) {
  const { t } = useI18n();
  const [creds, setCreds] = useState<GreenCredentials | null>(() => loadCredentials(kind));
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [receiving, setReceiving] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Reload threads when credentials / messenger change.
  useEffect(() => {
    const c = loadCredentials(kind);
    setCreds(c);
    if (c) {
      setThreads(loadThreads(kind, c.idInstance));
    } else {
      setThreads([]);
      setActiveId(null);
    }
  }, [kind]);

  useEffect(() => {
    if (creds) saveThreads(kind, creds.idInstance, threads);
  }, [threads, creds, kind]);

  const pushToast = useCallback((toastKind: ToastItem["kind"], text: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, kind: toastKind, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  const onEvent = useCallback(
    (event: ParsedEvent) => {
      if (event.type === "message") {
        setThreads((prev) => upsertMessage(prev, event.message, event.titleHint));
      } else if (event.type === "status") {
        setThreads((prev) => applyStatus(prev, event.idMessage, event.status));
      }
    },
    [],
  );

  useReceiveLoop({
    creds,
    enabled: Boolean(creds) && receiving,
    onEvent,
    onError: (err) => {
      // Avoid toast spam on every poll failure — log only; show soft info.
      if (err.message.includes("401") || err.message.toLowerCase().includes("credential")) {
        pushToast("error", t("needSettings"));
        setReceiving(false);
      }
    },
  });

  const active = useMemo(
    () => threads.find((th) => th.chatId === activeId) || null,
    [threads, activeId],
  );

  function openChat(chatId: string) {
    setActiveId(chatId);
    setMobileShowChat(true);
    setThreads((prev) =>
      prev.map((th) => (th.chatId === chatId ? { ...th, unread: 0 } : th)),
    );
  }

  async function handleSend() {
    if (!creds || !active || !draft.trim()) return;
    const text = draft.trim();
    setSending(true);
    setDraft("");
    try {
      const { idMessage } = await sendMessage(creds, active.chatId, text);
      const msg: ChatMessage = {
        id: idMessage,
        chatId: active.chatId,
        text,
        direction: "out",
        timestamp: Date.now(),
        status: "sent",
      };
      setThreads((prev) => upsertMessage(prev, msg));
      clientLog("info", "message.sent", { kind, chatId: active.chatId });
    } catch (err) {
      const message = err instanceof Error ? err.message : t("sendFailed");
      pushToast("error", message);
      setDraft(text);
      clientLog("error", "message.send_fail", { kind, message });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`messenger ${themeClass}`}>
      <aside className={`messenger__sidebar ${mobileShowChat ? "is-hidden-mobile" : ""}`}>
        <header className="messenger__side-head">
          <div className="messenger__brand">
            <span className="messenger__brand-mark" aria-hidden />
            <div>
              <strong>{brand}</strong>
              <small>{creds ? t("receiving") : t("needSettings")}</small>
            </div>
          </div>
          <div className="messenger__side-actions">
            <button
              type="button"
              className="icon-btn"
              title={t("newChat")}
              onClick={() => setNewChatOpen(true)}
              disabled={!creds}
            >
              +
            </button>
            <button
              type="button"
              className="icon-btn"
              title={t("settings")}
              onClick={() => setSettingsOpen(true)}
              aria-label={t("settings")}
            >
              ⚙
            </button>
          </div>
        </header>

        <div className="messenger__receive-toggle">
          <button
            type="button"
            className={`chip ${receiving ? "chip--on" : ""}`}
            onClick={() => setReceiving((v) => !v)}
            disabled={!creds}
          >
            {receiving ? t("disconnect") : t("connect")}
          </button>
          {receiving && creds ? <span className="pulse" title={t("receiving")} /> : null}
        </div>

        <ul className="chat-list">
          {threads.length === 0 ? (
            <li className="chat-list__empty">
              <p>{t("noChats")}</p>
              <small>{t("noChatsHint")}</small>
            </li>
          ) : (
            threads.map((th) => (
              <li key={th.chatId}>
                <button
                  type="button"
                  className={`chat-list__item ${th.chatId === activeId ? "is-active" : ""}`}
                  onClick={() => openChat(th.chatId)}
                >
                  <span className="avatar" aria-hidden>
                    {th.title.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="chat-list__meta">
                    <span className="chat-list__title">{th.title}</span>
                    <span className="chat-list__preview">
                      {th.messages[th.messages.length - 1]?.text || "—"}
                    </span>
                  </span>
                  {th.unread > 0 ? <span className="badge">{th.unread}</span> : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>

      <section className={`messenger__main ${mobileShowChat ? "is-visible-mobile" : ""}`}>
        {!active ? (
          <div className="messenger__placeholder">
            <div className="messenger__placeholder-card">
              <h2>{brand}</h2>
              <p>{t("selectChat")}</p>
              {!creds ? (
                <button type="button" className="btn btn--primary" onClick={() => setSettingsOpen(true)}>
                  {t("settings")}
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <header className="messenger__chat-head">
              <button
                type="button"
                className="icon-btn messenger__back"
                onClick={() => setMobileShowChat(false)}
                aria-label="Back"
              >
                ←
              </button>
              <span className="avatar avatar--sm">{active.title.slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{active.title}</strong>
                <small>{t("online")}</small>
              </div>
            </header>

            <div className="message-list">
              {active.messages.map((m) => (
                <div
                  key={m.id}
                  className={`bubble bubble--${m.direction}`}
                >
                  <p>{m.text}</p>
                  <time>
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {m.direction === "out" && m.status ? ` · ${m.status}` : ""}
                  </time>
                </div>
              ))}
            </div>

            <form
              className="composer"
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t("typeMessage")}
                disabled={sending}
                maxLength={4000}
              />
              <button type="submit" className="btn btn--primary" disabled={sending || !draft.trim()}>
                {sending ? <Spinner /> : t("send")}
              </button>
            </form>
          </>
        )}
      </section>

      <SettingsModal
        kind={kind}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={(c) => {
          setCreds(c);
          if (c) setThreads(loadThreads(kind, c.idInstance));
          else setThreads([]);
        }}
        pushToast={pushToast}
      />
      <NewChatModal
        kind={kind}
        open={newChatOpen}
        creds={creds}
        onClose={() => setNewChatOpen(false)}
        onCreated={(chatId, phone, title) => {
          setThreads((prev) => {
            if (prev.some((th) => th.chatId === chatId)) return prev;
            return [
              {
                chatId,
                phone,
                title,
                messages: [],
                unread: 0,
                updatedAt: Date.now(),
              },
              ...prev,
            ];
          });
          openChat(chatId);
        }}
        pushToast={pushToast}
      />
      <ToastStack items={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />
    </div>
  );
}
