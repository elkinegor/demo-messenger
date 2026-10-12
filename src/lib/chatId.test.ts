import { describe, expect, it } from "vitest";
import { digitsOnly, displayTitle, normalizeChatIdInput, phoneToChatId } from "./chatId";

describe("chatId helpers", () => {
  it("strips non-digits", () => {
    expect(digitsOnly("+7 (999) 123-45-67")).toBe("79991234567");
  });

  it("builds telegram-style chatId from phone", () => {
    expect(phoneToChatId("+7 999 123-45-67")).toBe("79991234567@c.us");
  });

  it("normalizes telegram phone input", () => {
    expect(normalizeChatIdInput("+79991234567", "telegram")).toBe("79991234567@c.us");
  });

  it("keeps existing chatId", () => {
    expect(normalizeChatIdInput("10000000", "max")).toBe("10000000");
    expect(normalizeChatIdInput("7999@c.us", "telegram")).toBe("7999@c.us");
  });

  it("formats display title", () => {
    expect(displayTitle("x", "+79991234567")).toBe("+79991234567");
    expect(displayTitle("79991234567@c.us")).toBe("+79991234567");
  });
});
