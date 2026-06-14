/** Textové logo TENISHUB (zatím místo obrázkového loga). HUB ve zlaté. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`wordmark${className ? " " + className : ""}`}>
      <span className="wm-t">TENIS</span>
      <span className="wm-h">HUB</span>
    </span>
  );
}
