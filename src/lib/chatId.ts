/**
 * Phone / chatId normalization for GREEN-API.
 * MAX prefers numeric chatId from checkAccount;
 * Telegram / WhatsApp use phone@c.us.
 */

/** Digits only; strips +, spaces, dashes. */
export function digitsOnly(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Build a WhatsApp-style chatId from a phone number.
 * Example: "+7 999 123-45-67" → "79991234567@c.us"
 */
export function phoneToChatId(phone: string): string {
  const digits = digitsOnly(phone);
  if (!digits) return "";
  return `${digits}@c.us`;
}

/** Accept either a raw chatId or a phone number. */
export function normalizeChatIdInput(
  input: string,
  mode: "max" | "telegram" | "whatsapp",
): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  // Already a chatId (numeric MAX id, negative group, or @c.us / @g.us).
  if (/^-?\d+$/.test(trimmed) || trimmed.includes("@")) {
    return trimmed;
  }
  if (mode === "telegram" || mode === "whatsapp") {
    return phoneToChatId(trimmed);
  }
  // For MAX we usually resolve via checkAccount; keep digits for the API call.
  return digitsOnly(trimmed);
}

/** Human-readable title for sidebar. */
export function displayTitle(chatId: string, phone?: string): string {
  if (phone) {
    const d = digitsOnly(phone);
    if (d.length >= 11) return `+${d}`;
    return phone;
  }
  if (chatId.endsWith("@c.us")) return `+${chatId.replace("@c.us", "")}`;
  return chatId;
}
