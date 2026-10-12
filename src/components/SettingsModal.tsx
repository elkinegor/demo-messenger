/**
 * Settings: GREEN-API credentials + language. Saves to cookies.
 */
import { useEffect, useState } from "react";
import { useI18n } from "../i18n/I18nContext";
import type { Locale } from "../i18n/messages";
import {
  clearCredentials,
  loadCredentials,
  saveCredentials,
} from "../lib/cookies";
import { getStateInstance } from "../lib/greenApi";
import { clientLog } from "../lib/loggerClient";
import type { GreenCredentials, MessengerKind } from "../lib/types";
import { Spinner } from "./Spinner";

type Props = {
  kind: MessengerKind;
  open: boolean;
  onClose: () => void;
  onSaved: (creds: GreenCredentials | null) => void;
  pushToast: (kind: "success" | "error" | "info", text: string) => void;
};

export function SettingsModal({ kind, open, onClose, onSaved, pushToast }: Props) {
  const { t, locale, setLocale } = useI18n();
  const [apiUrl, setApiUrl] = useState("");
  const [idInstance, setIdInstance] = useState("");
  const [apiTokenInstance, setApiTokenInstance] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const existing = loadCredentials(kind);
    setApiUrl(existing?.apiUrl || "");
    setIdInstance(existing?.idInstance || "");
    setApiTokenInstance(existing?.apiTokenInstance || "");
  }, [open, kind]);

  if (!open) return null;

  async function handleSave() {
    const creds: GreenCredentials = {
      apiUrl: apiUrl.trim().replace(/\/$/, ""),
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    };
    if (!creds.apiUrl || !creds.idInstance || !creds.apiTokenInstance) {
      pushToast("error", t("needSettings"));
      return;
    }
    setBusy(true);
    try {
      const state = await getStateInstance(creds);
      saveCredentials(kind, creds);
      onSaved(creds);
      clientLog("info", "settings.saved", {
        kind,
        idInstance: creds.idInstance,
        state: state.stateInstance,
      });
      if (state.stateInstance === "authorized") {
        pushToast("success", t("authorized"));
      } else {
        pushToast("info", `${t("notAuthorized")}: ${state.stateInstance}`);
      }
      pushToast("success", t("saved"));
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      clientLog("error", "settings.save_fail", { kind, message: msg });
      pushToast("error", msg);
    } finally {
      setBusy(false);
    }
  }

  function handleClear() {
    clearCredentials(kind);
    setApiUrl("");
    setIdInstance("");
    setApiTokenInstance("");
    onSaved(null);
    pushToast("info", t("cleared"));
    clientLog("info", "settings.cleared", { kind });
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={t("settingsTitle")}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__head">
          <h2>{t("settingsTitle")}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t("cancel")}>
            ×
          </button>
        </header>

        <div className="modal__body">
          <label className="field">
            <span>{t("apiUrl")}</span>
            <input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://XXXX.api.green-api.com"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label className="field">
            <span>{t("idInstance")}</span>
            <input
              value={idInstance}
              onChange={(e) => setIdInstance(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label className="field">
            <span>{t("apiTokenInstance")}</span>
            <input
              type="password"
              value={apiTokenInstance}
              onChange={(e) => setApiTokenInstance(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          <label className="field">
            <span>{t("language")}</span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </label>

          {busy ? <Spinner label={t("checking")} /> : null}
        </div>

        <footer className="modal__foot">
          <button type="button" className="btn btn--ghost" onClick={handleClear} disabled={busy}>
            {t("clear")}
          </button>
          <button type="button" className="btn btn--primary" onClick={() => void handleSave()} disabled={busy}>
            {t("save")}
          </button>
        </footer>
      </div>
    </div>
  );
}
