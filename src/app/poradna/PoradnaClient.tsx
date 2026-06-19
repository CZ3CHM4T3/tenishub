"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";
import { HelpCircle, Plus, X, Lock, CheckCircle2 } from "lucide-react";
import { useMe } from "@/lib/useMe";
import { notify } from "@/lib/notify";

type Q = { id: string; author_name: string | null; topic: string; body: string; answer: string | null; answered_by: string | null; created_at: string };

const TOPICS: [string, string][] = [
  ["trener", "Výběr trenéra/klubu"], ["trenink", "Trénink a rozvoj"], ["turnaje", "Turnaje a závody"],
  ["hlava", "Motivace a psychika"], ["zdravi", "Zdraví a kondice"], ["ostatni", "Ostatní"],
];
const topicLabel = (k: string) => TOPICS.find(([v]) => v === k)?.[1] ?? "Ostatní";
const fmt = (iso: string) => new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });

export default function PoradnaClient() {
  const supabase = useMemo(() => createClient(), []);
  const { me, canPost, isAdmin } = useMe();
  const [items, setItems] = useState<Q[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ open: boolean; topic: string; body: string }>({ open: false, topic: "trener", body: "" });
  const [gate, setGate] = useState<null | "login" | "hub">(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("advice").select("id,author_name,topic,body,answer,answered_by,created_at").order("created_at", { ascending: false }).limit(200);
    setItems((data as Q[]) ?? []);
    setLoading(false);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  const ask = () => {
    if (!me) { setGate("login"); return; }
    if (!canPost) { setGate("hub"); return; }
    setForm({ open: true, topic: "trener", body: "" });
  };
  const submit = async () => {
    if (!me || !form.body.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("advice").insert({ author_id: me.id, author_name: me.name, topic: form.topic, body: form.body.trim() });
    setBusy(false);
    if (error) { alert("Nepodařilo se odeslat: " + error.message); return; }
    setForm({ open: false, topic: "trener", body: "" });
    await load();
    alert("Dotaz odeslán. Odpovíme co nejdřív — uvidíte ho tady.");
  };
  const answer = async (id: string) => {
    const txt = (answers[id] || "").trim();
    if (!txt || !me) return;
    setBusy(true);
    await supabase.from("advice").update({ answer: txt, answered_by: me.name, answered_at: new Date().toISOString() }).eq("id", id);
    notify("advice_answer", id);
    setBusy(false);
    setAnswers((a) => ({ ...a, [id]: "" }));
    await load();
  };

  return (
    <div className="acct-page">
      <header className="subhdr"><div className="wrap"><div className="bar">
        <Link href="/" className="brand"><Wordmark /></Link>
        <Link href="/rodic" className="back">← Rodič &amp; dítě</Link>
      </div></div></header>

      <div className="wrap acct-wrap" style={{ maxWidth: 820 }}>
        <div className="mc-head">
          <h1 className="acct-h1"><HelpCircle size={26} style={{ verticalAlign: "-4px" }} /> Poradna</h1>
          <button className="btn btn-green" onClick={ask}><Plus size={16} /> Zeptat se</button>
        </div>
        <div className="pora-intro">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/poradna.jpg" alt="" className="pora-portrait" />
          <p className="member-note" style={{ margin: 0 }}>Zeptejte se na cokoli kolem tenisu vašeho dítěte — výběr trenéra, trénink, motivaci, zdraví. Odpovídá odborník, odpovědi vidí všichni; ptát se můžou členové <b>HUB+</b>.</p>
        </div>

        {loading ? <p className="member-note">Načítám…</p> : items.length === 0 ? (
          <div className="acct-card mc-gate"><HelpCircle size={30} /><h2>Zatím žádné dotazy</h2><p>Buďte první — zeptejte se.</p></div>
        ) : (
          <div className="fposts">
            {items.map((q) => (
              <div className="acct-card pora-item" key={q.id}>
                <div className="fpost-head"><span className="pora-topic">{topicLabel(q.topic)}</span><b>{q.author_name || "Rodič"}</b><span>{fmt(q.created_at)}</span></div>
                <p className="pora-q">{q.body}</p>
                {q.answer ? (
                  <div className="pora-a"><span className="pora-a-head"><CheckCircle2 size={15} /> Odpověď{q.answered_by ? ` — ${q.answered_by}` : ""}</span><p>{q.answer}</p></div>
                ) : isAdmin ? (
                  <div className="pora-answer">
                    <textarea rows={3} value={answers[q.id] || ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} placeholder="Odpovědět jako odborník…" className="freply-ta" />
                    <button className="btn btn-gold btn-sm" disabled={busy} onClick={() => answer(q.id)}>Odeslat odpověď</button>
                  </div>
                ) : <p className="pora-wait">Čeká na odpověď odborníka…</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {form.open && (
        <div className="mc-modal" onClick={() => setForm({ ...form, open: false })}>
          <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
            <button className="mc-x" onClick={() => setForm({ ...form, open: false })}><X size={18} /></button>
            <h3>Zeptat se odborníka</h3>
            <label>Téma<select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>{TOPICS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            <label>Váš dotaz<textarea rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Popište situaci co nejkonkrétněji…" /></label>
            <button className="btn btn-green" disabled={busy} onClick={submit}>Odeslat dotaz</button>
          </div>
        </div>
      )}

      {gate && (
        <div className="mc-modal" onClick={() => setGate(null)}>
          <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
            <button className="mc-x" onClick={() => setGate(null)}><X size={18} /></button>
            <h3>{gate === "login" ? "Přihlaste se" : "Ptaní je součást HUB+"}</h3>
            <p className="member-note">{gate === "login" ? "Pro položení dotazu se přihlaste." : "Odpovědi vidí všichni zdarma. Ptát se odborníka můžou členové HUB+."}</p>
            <Link href={gate === "login" ? "/prihlaseni?next=/poradna" : "/ucet"} className={`btn ${gate === "login" ? "btn-green" : "btn-gold"}`} style={{ width: "100%" }}>{gate === "login" ? "Přihlásit se" : <><Lock size={15} /> Chci HUB+</>}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
