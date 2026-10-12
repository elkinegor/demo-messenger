/**
 * Long-poll loop: ReceiveNotification → parse → DeleteNotification.
 * Stops cleanly on unmount or when credentials disappear.
 */
import { useEffect, useRef } from "react";
import { deleteNotification, receiveNotification } from "../lib/greenApi";
import { clientLog } from "../lib/loggerClient";
import {
  parseNotification,
  type IncomingNotification,
  type ParsedEvent,
} from "../lib/notifications";
import type { GreenCredentials } from "../lib/types";

type Options = {
  creds: GreenCredentials | null;
  enabled: boolean;
  onEvent: (event: ParsedEvent) => void;
  onError?: (err: Error) => void;
};

export function useReceiveLoop({ creds, enabled, onEvent, onError }: Options): void {
  const onEventRef = useRef(onEvent);
  const onErrorRef = useRef(onError);
  onEventRef.current = onEvent;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!creds || !enabled) return;

    let cancelled = false;
    const current = creds;

    async function loop() {
      while (!cancelled) {
        try {
          const note = await receiveNotification(current, 20);
          if (cancelled) break;
          if (note) {
            const parsed = parseNotification(note as IncomingNotification);
            onEventRef.current(parsed);
            await deleteNotification(current, note.receiptId);
          }
        } catch (err) {
          if (cancelled) break;
          const e = err instanceof Error ? err : new Error(String(err));
          clientLog("error", "receive.loop_error", {
            message: e.message,
          });
          onErrorRef.current?.(e);
          // Back off briefly on errors (auth, network).
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    }

    clientLog("info", "receive.loop_start", { idInstance: creds.idInstance });
    void loop();

    return () => {
      cancelled = true;
      clientLog("info", "receive.loop_stop", { idInstance: creds.idInstance });
    };
  }, [creds, enabled]);
}
