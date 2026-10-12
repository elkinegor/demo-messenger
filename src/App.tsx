/**
 * Root: messenger tabs (MAX / Telegram / WhatsApp) + shared chrome.
 */
import { useState } from "react";
import { MaxShell } from "./components/messengers/MaxShell";
import { TelegramShell } from "./components/messengers/TelegramShell";
import { WhatsappShell } from "./components/messengers/WhatsappShell";
import { useI18n } from "./i18n/I18nContext";
import type { MessengerKind } from "./lib/types";

export default function App() {
  const { t, locale, setLocale } = useI18n();
  const [tab, setTab] = useState<MessengerKind>("max");

  return (
    <div className="app-shell">
      <header className="app-top">
        <div className="app-top__left">
          <span className="app-logo">demo-messenger</span>
        </div>
        <nav className="tabs" aria-label="Messenger">
          <button
            type="button"
            className={`tabs__btn ${tab === "max" ? "is-active" : ""}`}
            onClick={() => setTab("max")}
          >
            {t("tabMax")}
          </button>
          <button
            type="button"
            className={`tabs__btn ${tab === "telegram" ? "is-active" : ""}`}
            onClick={() => setTab("telegram")}
          >
            {t("tabTelegram")}
          </button>
          <button
            type="button"
            className={`tabs__btn ${tab === "whatsapp" ? "is-active" : ""}`}
            onClick={() => setTab("whatsapp")}
          >
            {t("tabWhatsapp")}
          </button>
        </nav>
        <div className="app-top__right">
          <button
            type="button"
            className="lang-btn"
            onClick={() => setLocale(locale === "ru" ? "en" : "ru")}
            aria-label={t("language")}
          >
            {locale === "ru" ? "EN" : "RU"}
          </button>
        </div>
      </header>
      <main className="app-main">
        {tab === "max" ? <MaxShell /> : null}
        {tab === "telegram" ? <TelegramShell /> : null}
        {tab === "whatsapp" ? <WhatsappShell /> : null}
      </main>
    </div>
  );
}
