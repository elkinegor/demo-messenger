import { describe, expect, it } from "vitest";
import { parseNotification, type IncomingNotification } from "./notifications";

function note(partial: IncomingNotification["body"]): IncomingNotification {
  return { receiptId: 1, body: partial };
}

describe("parseNotification", () => {
  it("parses incoming text", () => {
    const event = parseNotification(
      note({
        typeWebhook: "incomingMessageReceived",
        idMessage: "m1",
        timestamp: 1_700_000_000,
        senderData: { chatId: "100", chatName: " ann" },
        messageData: {
          typeMessage: "textMessage",
          textMessageData: { textMessage: "hello" },
        },
      }),
    );
    expect(event.type).toBe("message");
    if (event.type === "message") {
      expect(event.message.text).toBe("hello");
      expect(event.message.direction).toBe("in");
      expect(event.titleHint).toBe(" ann");
    }
  });

  it("parses outgoing status", () => {
    const event = parseNotification(
      note({
        typeWebhook: "outgoingMessageStatus",
        idMessage: "m2",
        statusData: { status: "delivered" },
      }),
    );
    expect(event).toEqual({ type: "status", idMessage: "m2", status: "delivered" });
  });

  it("ignores unknown webhooks", () => {
    expect(parseNotification(note({ typeWebhook: "somethingElse" })).type).toBe("ignore");
  });
});
