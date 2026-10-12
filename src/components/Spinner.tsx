/** CSS spinner used during API waits. */
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="spinner" role="status" aria-label={label || "loading"}>
      <span className="spinner__ring" aria-hidden />
      {label ? <span className="spinner__label">{label}</span> : null}
    </div>
  );
}
