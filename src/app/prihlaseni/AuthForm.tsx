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
  const isTrenerReg = params.get("role") === "trener"; // trenér má registraci OTEVŘENOU
  const canRegister = !!invite || isTrenerReg; // rodič jen přes pozvánku, trenér volně
  const [tab, setTab] = useState<"login" | "reg">(invite || isTrenerReg ? "reg" : "login");
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

  // Po přihlášení/registraci: uplatní pozvánku (trenér/rodič) nebo aktivuje trenéra a přesměruje.
  const finishAuth = async (supabase: ReturnType<typeof createClient>) => {
    let code: string | null = invite || null;
    let becomeCoach = isTrenerReg;
    try { code = code || localStorage.getItem("th_invite"); } catch { /* */ }
    try { becomeCoach = becomeCoach || localStorage.getItem("th_become_coach") === "1"; } catch { /* */ }
    if (code) {
      try {
        const { data: res } = await supabase.rpc("apply_invite", { p_code: code });
        try { localStorage.removeItem("th_invite"); } catch { /* */ }
        if (res === "coach") { router.push("/klub"); return; }
      } catch { /* neplatný kód ignoruj */ }
    }
    if (becomeCoach) {
      try { await supabase.rpc("become_coach"); } catch { /* */ }
      try { localStorage.removeItem("th_become_coach"); } catch { /* */ }
      router.push("/klub"); return;
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
      await finishAuth(supabase);
    } else {
      if (invite) { try { localStorage.setItem("th_invite", invite); } catch { /* */ } }
      if (isTrenerReg) { try { localStorage.setItem("th_become_coach", "1"); } catch { /* */ } }
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } },
      });
      if (error) { setErr(czError(error.message)); setBusy(false); return; }
      if (data.session) {
        await finishAuth(supabase);
      } else {
        setInfo(isTrenerReg
          ? "Hotovo! Potvrď registraci v e-mailu a přihlas se — otevře se tvoje trenérské rozhraní."
          : "Hotovo! Potvrď registraci kliknutím na odkaz v e-mailu a pak se přihlas — pozvánka se uplatní.");
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
          {canRegister && <button className={tab === "reg" && !forgot ? "on" : ""} onClick={() => { setTab("reg"); setForgot(false); setErr(null); }} type="button">Registrace</button>}
        </div>

        {(invite || isTrenerReg) && !forgot && tab === "reg" && (
          <div className="auth-info" style={{ marginBottom: "1rem" }}>
            {invite && invite.toUpperCase().startsWith("TRN")
              ? "Pozvánka pro trenéra — po registraci se otevře vaše trenérské rozhraní."
              : invite && invite.toUpperCase().startsWith("MEM")
              ? "Pozvánka do TenisHubu — po registraci máte přístup ke všem funkcím."
              : invite
              ? "Pozvánka od trenéra — po registraci se připojíte do jeho klubu."
              : "Registrace trenéra je zdarma. Po vytvoření profilu se otevře vaše trenérské rozhraní."}
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

        {!canRegister && (
          <p className="auth-note">
            Rodičovský účet teď založíme jen přes pozvánku (od trenéra nebo od nás). Jste trenér? <Link href="/pro-trenery">Založte si profil zdarma →</Link>
          </p>
        )}
      </div>
    </div>
  );
}
