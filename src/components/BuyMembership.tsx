"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

// Tlačítko „Zaplatit členství" — spustí Barion platbu a přesměruje na bránu.
export function BuyMembership({ plan = "hub_plus", label = "Zaplatit HUB+ · 99 Kč / měsíc" }: { plan?: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const go = async () => {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/barion/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
      const d = await r.json();
      if (d.gatewayUrl) { window.location.href = d.gatewayUrl; return; }
      setErr(d.error || "Platbu se nepodařilo spustit."); setBusy(false);
    } catch { setErr("Chyba spojení, zkus to prosím znovu."); setBusy(false); }
  };

  return (
    <>
      <button className="btn btn-gold" onClick={go} disabled={busy} type="button">{busy ? "Přesměrovávám…" : label} <ArrowRight size={16} /></button>
      {err && <p className="member-note" style={{ color: "#b5546e", marginTop: ".5rem" }}>{err}</p>}
    </>
  );
}

// Tlačítko „Vyzkoušet týden zdarma" — aktivuje 7denní zkušební členství bez karty (jednou na účet).
export function TrialButton() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const go = async () => {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/trial", { method: "POST" });
      const d = await r.json();
      if (d.ok) { window.location.href = "/ucet?tab=clenstvi"; return; }
      setErr(d.error || "Nepodařilo se aktivovat."); setBusy(false);
    } catch { setErr("Chyba spojení, zkus to prosím znovu."); setBusy(false); }
  };
  return (
    <>
      <button className="btn btn-green" onClick={go} disabled={busy} type="button">{busy ? "Aktivuji…" : "Vyzkoušet týden zdarma"}</button>
      {err && <p className="member-note" style={{ color: "#b5546e", marginTop: ".5rem" }}>{err}</p>}
    </>
  );
}
