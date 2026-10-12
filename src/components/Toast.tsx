/**
 * Lightweight toast stack — success / error / info.
 */
import type { ToastItem } from "../lib/types";

type Props = {
  items: ToastItem[];
  onDismiss: (id: string) => void;
};

export function ToastStack({ items, onDismiss }: Props) {
  if (!items.length) return null;
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`toast toast--${t.kind}`}
          onClick={() => onDismiss(t.id)}
        >
          <span className="toast__dot" aria-hidden />
          <span>{t.text}</span>
        </button>
      ))}
    </div>
  );
}
