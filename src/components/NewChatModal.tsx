/**
 * Create a new chat by phone.
 * MAX: checkAccount → numeric chatId.
 * Telegram / WhatsApp: phone@c.us (GREEN-API WhatsApp-compatible id).
 */
import { useState } from "react";
import { useI18n } from "../i18n/I18nContext";
import { digitsOnly, displayTitle, phoneToChatId } from "../lib/chatId";
import { checkAccount } from "../lib/greenApi";
import { clientLog } from "../lib/loggerClient";
import type { GreenCredentials, MessengerKind } from "../lib/types";
import { Spinner } from "./Spinner";

type Props = {
  kind: MessengerKind;
  open: boolean;
  creds: GreenCredentials | null;
  onClose: () => void;
  onCreated: (chatId: string, phone: string, title: string) => void;
  pushToast: (kind: "success" | "error" | "info", text: string) => void;
};

export function NewChatModal({
  kind,
  open,
  creds,
  onClose,
  onCreated,
  pushToast,
}: Props) {
  const { t } = useI18n();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function handleCreate() {
    if (!creds) {
      pushToast("error", t("needSettings"));
      return;
    }
    const raw = phone.trim();
    if (!raw) return;

    setBusy(true);
    try {
      let chatId: string;
      if (kind === "max") {
        const digits = digitsOnly(raw);
        const result = await checkAccount(creds, digits);
        if (!result.exists || !result.chatId) {
          throw new Error(t("chatFailed"));
        }
        chatId = String(result.chatId);
      } else {
        chatId = raw.includes("@") ? raw : phoneToChatId(raw);
        if (!chatId) throw new Error(t("chatFailed"));
      }
      const title = displayTitle(chatId, raw);
      onCreated(chatId, raw, title);
      pushToast("success", t("chatCreated"));
      clientLog("info", "chat.created", { kind, chatId });
      setPhone("");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("chatFailed");
      pushToast("error", msg);
      clientLog("error", "chat.create_fail", { kind, message: msg });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={t("newChat")}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__head">
          <h2>{t("newChat")}</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="modal__body">
          <label className="field">
            <span>{t("phone")}</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 999 123-45-67"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleCreate();
              }}
            />
            <small className="field__hint">
              {kind === "max"
                ? t("phoneHintMax")
                : kind === "whatsapp"
                  ? t("phoneHintWhatsapp")
                  : t("phoneHintTelegram")}
            </small>
          </label>
          {busy ? <Spinner label={t("checking")} /> : null}
        </div>
        <footer className="modal__foot">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
            {t("cancel")}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void handleCreate()}
            disabled={busy}
          >
            {t("create")}
          </button>
        </footer>
      </div>
    </div>
  );
}
