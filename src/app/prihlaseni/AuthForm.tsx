"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";

// Překlad nejčastějších chyb Supabase do češtiny.
function czError(msg: string) {
  if (/invalid login credentials/i.test(msg)) return "Špatný e-mail nebo heslo.";
  if (/already registered/i.test(msg)) return "Tento e-mail už je zaregistrovaný — přihlas se.";
  if (/password should be at least/i.test(msg)) return "Heslo musí mít aspoň 6 znaků.";
  if (/valid email/i.test(msg)) return "Zadej platný e-mail.";
  if (/email not confirmed/i.test(msg)) return "E-mail ještě není potvrzený — mrkni do schránky.";
  return msg;
}

export default function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const invite = params.get("invite") || "";
  const [tab, setTab] = useState<"login" | "reg">(params.get("tab") === "reg" || invite ? "reg" : "login");
  const [forgot, setForgot] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null); setInfo(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/obnova`,
    });
    setBusy(false);
    if (error) { setErr(czError(error.message)); return; }
    setInfo("Hotovo — poslali jsme ti e-mail s odkazem pro nastavení nového hesla.");
  };

  // Uplatní zvací kód (trenérská pozvánka nebo připojení pod trenéra) a přesměruje.
  const applyInviteAndGo = async (supabase: ReturnType<typeof createClient>, code: string | null) => {
    if (code) {
      try {
        const { data: res } = await supabase.rpc("apply_invite", { p_code: code });
        try { localStorage.removeItem("th_invite"); } catch { /* */ }
        if (res === "coach") { router.push("/klub"); return; }
      } catch { /* neplatný kód ignoruj */ }
    }
    router.push("/ucet");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null); setInfo(null);
    const supabase = createClient();
    if (tab === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setErr(czError(error.message)); setBusy(false); return; }
      let stashed: string | null = invite || null;
      try { stashed = stashed || localStorage.getItem("th_invite"); } catch { /* */ }
      await applyInviteAndGo(supabase, stashed);
    } else {
      if (invite) { try { localStorage.setItem("th_invite", invite); } catch { /* */ } }
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } },
      });
      if (error) { setErr(czError(error.message)); setBusy(false); return; }
      if (data.session) {
        await applyInviteAndGo(supabase, invite || null);
      } else {
        setInfo("Hotovo! Potvrď registraci kliknutím na odkaz v e-mailu a pak se přihlas — pozvánka se uplatní.");
        setBusy(false);
      }
    }
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
        <div className="auth-tabs">
          <button className={tab === "login" && !forgot ? "on" : ""} onClick={() => { setTab("login"); setForgot(false); setErr(null); }} type="button">Přihlášení</button>
          <button className={tab === "reg" && !forgot ? "on" : ""} onClick={() => { setTab("reg"); setForgot(false); setErr(null); }} type="button">Registrace</button>
        </div>

        {invite && !forgot && (
          <div className="auth-info" style={{ marginBottom: "1rem" }}>
            {invite.toUpperCase().startsWith("TRN")
              ? "Pozvánka pro trenéra — po registraci se otevře vaše trenérské rozhraní."
              : "Pozvánka od trenéra — po registraci se připojíte do jeho klubu."}
          </div>
        )}

        {forgot ? (
          <form onSubmit={sendReset}>
            <p className="member-note" style={{ marginTop: 0 }}>Zadej e-mail, se kterým ses registroval — pošleme ti odkaz pro nastavení nového hesla.</p>
            <div className="fld"><label>E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jan@email.cz" required />
            </div>
            {err && <div className="auth-err">{err}</div>}
            {info && <div className="auth-info">{info}</div>}
            <button className="btn btn-gold" style={{ width: "100%" }} disabled={busy} type="submit">
              {busy ? "Posílám…" : "Poslat odkaz pro obnovu"}
            </button>
            <button className="auth-forgot" type="button" onClick={() => { setForgot(false); setErr(null); setInfo(null); }}>← Zpět na přihlášení</button>
          </form>
        ) : (
        <form onSubmit={submit}>
          {tab === "reg" && (
            <div className="fld"><label>Jméno a příjmení</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jan Novák" required />
            </div>
          )}
          <div className="fld"><label>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jan@email.cz" required />
          </div>
          <div className="fld"><label>Heslo</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="aspoň 6 znaků" minLength={6} required />
          </div>

          {err && <div className="auth-err">{err}</div>}
          {info && <div className="auth-info">{info}</div>}

          <button className="btn btn-gold" style={{ width: "100%" }} disabled={busy} type="submit">
            {busy ? "Pracuju…" : tab === "login" ? "Přihlásit se" : invite ? "Registrovat se" : "Staň se členem"}
          </button>
          {tab === "login" && (
            <button className="auth-forgot" type="button" onClick={() => { setForgot(true); setErr(null); setInfo(null); }}>Zapomněl jsi heslo?</button>
          )}
        </form>
        )}

        {!invite && (
          <p className="auth-note">
            Registrace tě rovnou zapojí do klubu. <b>HUBmember</b> 99 Kč/měsíc, kdykoli zrušíš — žádné skryté platby.
          </p>
        )}
      </div>
    </div>
  );
}
