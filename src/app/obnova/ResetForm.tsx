"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";

export default function ResetForm() {
  const router = useRouter();
  const [ready, setReady] = useState<"checking" | "ok" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Odkaz z e-mailu přihlásí uživatele (recovery session) — počkáme, až klient session zpracuje.
  useEffect(() => {
    const supabase = createClient();
    let done = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (done) return;
      if (event === "PASSWORD_RECOVERY" || session?.user) { done = true; setReady("ok"); }
    });
    supabase.auth.getUser().then(({ data }) => {
      if (!done && data.user) { done = true; setReady("ok"); }
    });
    const t = setTimeout(() => { if (!done) setReady("invalid"); }, 4000);
    return () => { sub.subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    router.push("/ucet");
  };

  return (
    <div className="auth-page">
      <header className="subhdr">
        <div className="wrap">
          <div className="bar">
            <Link href="/" className="brand"><Wordmark /></Link>
            <Link href="/" className="back">← Zpět na web</Link>
          </div>
        </div>
      </header>

      <div className="auth-box">
        <h2 style={{ color: "var(--green-d)", marginBottom: "1rem", fontSize: "1.3rem" }}>Nastavit nové heslo</h2>

        {ready === "checking" && <p className="member-note">Ověřuji odkaz…</p>}

        {ready === "invalid" && (
          <>
            <div className="auth-err">Odkaz je neplatný nebo vypršel.</div>
            <Link href="/prihlaseni" className="btn btn-out" style={{ width: "100%" }}>Poslat nový odkaz</Link>
          </>
        )}

        {ready === "ok" && (
          <form onSubmit={submit}>
            <div className="fld"><label>Nové heslo</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="aspoň 6 znaků" minLength={6} required autoFocus />
            </div>
            {err && <div className="auth-err">{err}</div>}
            <button className="btn btn-gold" style={{ width: "100%" }} disabled={busy} type="submit">
              {busy ? "Ukládám…" : "Uložit a přihlásit"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
