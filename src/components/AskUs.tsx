"use client";

import { useState } from "react";
import { MessageCircleQuestion, Send, Check } from "lucide-react";

// „Zeptejte se nás" — jednoduché okno, chodí nám na mail + do administrace.
// Ochrana: skryté pole honeypot (boti ho vyplní) + serverový filtr spamu.
export function AskUs() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "sending" | "done" | "err">("idle");
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (body.trim().length < 3) { setErr("Napište prosím svůj dotaz."); setState("err"); return; }
    setState("sending"); setErr("");
    try {
      const r = await fetch("/api/kontakt", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, body, website }),
      });
      const j = await r.json();
      if (j.ok) { setState("done"); setName(""); setEmail(""); setBody(""); }
      else { setErr(j.error || "Nepodařilo se odeslat."); setState("err"); }
    } catch { setErr("Nepodařilo se odeslat, zkuste to prosím znovu."); setState("err"); }
  };

  return (
    <section className="askus" id="zeptejte-se">
      <div className="askus-in">
        <div className="askus-l">
          <span className="askus-ic"><MessageCircleQuestion size={26} /></span>
          <h2>Nevíte si rady? Zeptejte se nás</h2>
          <p>Ať řešíte prvního trenéra, kariéru dítěte nebo cokoli kolem tenisu — napište nám a rádi poradíme. Nejsme robot, odpovídá člověk.</p>
        </div>
        {state === "done" ? (
          <div className="askus-done">
            <span className="askus-done-ic"><Check size={30} /></span>
            <b>Díky! Máme to.</b>
            <span>Ozveme se vám co nejdřív.</span>
          </div>
        ) : (
          <form className="askus-form" onSubmit={submit}>
            <div className="askus-row2">
              <input aria-label="Jméno" placeholder="Jméno (nepovinné)" value={name} onChange={(e) => setName(e.target.value)} />
              <input aria-label="E-mail" type="email" placeholder="Váš e-mail (ať můžeme odpovědět)" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <textarea aria-label="Dotaz" placeholder="Na co se chcete zeptat?" rows={3} value={body} onChange={(e) => setBody(e.target.value)} required />
            {/* honeypot — skryté před lidmi, boti ho vyplní */}
            <input className="askus-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} />
            {state === "err" && <span className="askus-err">{err}</span>}
            <button className="btn btn-green askus-send" type="submit" disabled={state === "sending"}>
              {state === "sending" ? "Odesílám…" : <>Odeslat dotaz <Send size={16} /></>}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
