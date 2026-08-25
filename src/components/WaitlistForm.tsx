"use client";

// Předběžný přístup — sběr e-mailů zájemců o členství (než spustíme platby).
// Kdo se zapíše do konce roku a koupí členství včas, drží si zakládající cenu 99.
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, Check, Loader2 } from "lucide-react";

export function WaitlistForm() {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true); setErr(null);
    const { error } = await supabase.from("waitlist").insert({ email: email.trim(), name: name.trim() || null });
    setBusy(false);
    if (error) { setErr("Nepodařilo se odeslat, zkus to prosím znovu."); return; }
    setDone(true);
  };

  if (done) return (
    <div className="wl-done">
      <span className="wl-done-ic"><Check size={26} /></span>
      <h3>Jsi na seznamu! 🎾</h3>
      <p>Ozveme se, jakmile spustíme členství. Když ho pořídíš do konce roku, <b>zakládající cena 99 Kč/měsíc ti zůstane napořád</b>.</p>
    </div>
  );

  return (
    <form className="wl-form" onSubmit={submit}>
      <div className="wl-fields">
        <div className="fld"><label>Jméno <span className="wl-opt">(nepovinné)</span></label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jan Novák" />
        </div>
        <div className="fld"><label>E-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jan@email.cz" required />
        </div>
      </div>
      {err && <div className="auth-err">{err}</div>}
      <button className="btn btn-gold" disabled={busy} type="submit" style={{ width: "100%" }}>
        {busy ? <><Loader2 size={16} className="spin" /> Odesílám…</> : <><Mail size={16} /> Chci předběžný přístup</>}
      </button>
      <p className="wl-fine">Žádný spam. Napíšeme jen, až spustíme členství.</p>
    </form>
  );
}
