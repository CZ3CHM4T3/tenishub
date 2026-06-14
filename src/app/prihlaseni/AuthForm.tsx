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
  const [tab, setTab] = useState<"login" | "reg">(params.get("tab") === "reg" ? "reg" : "login");
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null); setInfo(null);
    const supabase = createClient();
    if (tab === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setErr(czError(error.message)); setBusy(false); return; }
      router.push("/ucet");
    } else {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } },
      });
      if (error) { setErr(czError(error.message)); setBusy(false); return; }
      if (data.session) {
        router.push("/ucet");
      } else {
        setInfo("Hotovo! Potvrď registraci kliknutím na odkaz v e-mailu a pak se přihlas.");
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
            {busy ? "Pracuju…" : tab === "login" ? "Přihlásit se" : "Vytvořit účet zdarma"}
          </button>
          {tab === "login" && (
            <button className="auth-forgot" type="button" onClick={() => { setForgot(true); setErr(null); setInfo(null); }}>Zapomněl jsi heslo?</button>
          )}
        </form>
        )}

        <p className="auth-note">
          Účet je zdarma. Členství <b>HUB+</b> si zapneš (a kdykoli vypneš) ve svém účtu — žádné skryté platby.
        </p>
      </div>
    </div>
  );
}
