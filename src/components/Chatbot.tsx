"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Send } from "lucide-react";
import { matchFaq, QUICK } from "@/lib/chatbot-faq";

type Msg = { from: "bot" | "user"; text: string; link?: { label: string; href: string } };

const Ball = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#b6e02a" />
    <path d="M4.2 6.5a11 11 0 0 1 0 11M19.8 6.5a11 11 0 0 0 0 11" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && msgs.length === 0)
      setMsgs([{ from: "bot", text: "Ahoj, jsem Tenísek! 🎾 Pomůžu ti zorientovat se v TenisHubu. Na co se chceš zeptat?" }]);
  }, [open, msgs.length]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const ask = (q: string) => {
    const question = q.trim();
    if (!question) return;
    const hit = matchFaq(question);
    const reply: Msg = hit
      ? { from: "bot", text: hit.a, link: hit.link }
      : { from: "bot", text: "Tohle přesně nevím 🙈 Zkus to napsat jinak — nebo nám napiš přes okno Zeptejte se nás, odpoví ti člověk.", link: { label: "Zeptejte se nás", href: "/#zeptejte-se" } };
    setMsgs((m) => [...m, { from: "user", text: question }, reply]);
    setInput("");
  };

  return (
    <>
      <button className={`cbot-fab${open ? " open" : ""}`} onClick={() => setOpen((o) => !o)} aria-label="Poradce Tenísek" aria-expanded={open}>
        {open ? <X size={22} /> : <span className="cbot-ball"><Ball /></span>}
      </button>

      {open && (
        <div className="cbot-panel" role="dialog" aria-label="Poradce Tenísek">
          <div className="cbot-head">
            <span className="cbot-ball sm"><Ball /></span>
            <div className="cbot-head-tx"><b>Tenísek</b><span>tenisový průvodce</span></div>
            <button className="cbot-x" onClick={() => setOpen(false)} aria-label="Zavřít"><X size={18} /></button>
          </div>
          <div className="cbot-body">
            {msgs.map((m, i) => (
              <div key={i} className={`cbot-msg ${m.from}`}>
                {m.from === "bot" && <span className="cbot-av"><Ball /></span>}
                <span className="cbot-bub">
                  {m.text}
                  {m.link && <Link href={m.link.href} className="cbot-link" onClick={() => setOpen(false)}>{m.link.label} →</Link>}
                </span>
              </div>
            ))}
            <div className="cbot-quick">
              {msgs.length > 1 && <span className="cbot-quick-l">Zeptat se dál:</span>}
              {QUICK.map((q) => <button key={q} type="button" onClick={() => ask(q)}>{q}</button>)}
            </div>
            <div ref={endRef} />
          </div>
          <form className="cbot-input" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Napiš svůj dotaz…" aria-label="Dotaz pro Teníska" />
            <button type="submit" aria-label="Odeslat"><Send size={16} /></button>
          </form>
        </div>
      )}
    </>
  );
}
