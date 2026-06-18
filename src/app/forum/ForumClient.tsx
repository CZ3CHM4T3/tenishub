"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";
import { MessagesSquare, Plus, Pin, X, Lock } from "lucide-react";
import { FORUM_CATS, catLabel } from "@/lib/forum";

type Thread = { id: string; author_name: string | null; category: string; title: string; pinned: boolean; reply_count: number; last_at: string; created_at: string };

const fmt = (iso: string) => new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });

export default function ForumClient() {
  const supabase = useMemo(() => createClient(), []);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<string>("");
  const [canPost, setCanPost] = useState(false);
  const [me, setMe] = useState<{ id: string; name: string } | null>(null);
  const [gate, setGate] = useState<null | "login" | "hub">(null);
  const [form, setForm] = useState<{ open: boolean; category: string; title: string; body: string }>({ open: false, category: "zaciname", title: "", body: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("forum_threads").select("id,author_name,category,title,pinned,reply_count,last_at,created_at")
      .order("pinned", { ascending: false }).order("last_at", { ascending: false }).limit(200);
    setThreads((data as Thread[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [prof, mem] = await Promise.all([
          supabase.from("profiles").select("full_name,email,is_admin").eq("id", user.id).maybeSingle(),
          supabase.from("memberships").select("id").eq("profile_id", user.id).eq("status", "active").gt("expires_at", new Date().toISOString()).limit(1).maybeSingle(),
        ]);
        setMe({ id: user.id, name: prof.data?.full_name || prof.data?.email || "Člen" });
        setCanPost(!!mem.data || prof.data?.is_admin === true);
      }
      await load();
    })();
  }, [supabase, load]);

  const newThread = () => {
    if (!me) { setGate("login"); return; }
    if (!canPost) { setGate("hub"); return; }
    setForm({ open: true, category: cat || "zaciname", title: "", body: "" });
  };

  const submit = async () => {
    if (!me || !form.title.trim() || !form.body.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.from("forum_threads").insert({
      author_id: me.id, author_name: me.name, category: form.category, title: form.title.trim(), body: form.body.trim(),
    }).select("id").single();
    setBusy(false);
    if (error) { alert("Nepodařilo se založit téma: " + error.message); return; }
    setForm({ open: false, category: "zaciname", title: "", body: "" });
    if (data) window.location.href = `/forum/${data.id}`;
  };

  const shown = cat ? threads.filter((t) => t.category === cat) : threads;

  return (
    <div className="acct-page">
      <header className="subhdr"><div className="wrap"><div className="bar">
        <Link href="/" className="brand"><Wordmark /></Link>
        <Link href="/rodic" className="back">← Rodič &amp; dítě</Link>
      </div></div></header>

      <div className="wrap acct-wrap">
        <div className="mc-head">
          <h1 className="acct-h1"><MessagesSquare size={26} style={{ verticalAlign: "-4px" }} /> Fórum rodičů</h1>
          <button className="btn btn-green" onClick={newThread}><Plus size={16} /> Nové téma</button>
        </div>
        <p className="member-note" style={{ marginTop: "-0.4rem" }}>Ptejte se a sdílejte zkušenosti. Čtení je pro všechny; psaní je součást <b>HUB+</b>.</p>

        <div className="fcats">
          <button className={`fcat${cat === "" ? " on" : ""}`} onClick={() => setCat("")}>Vše</button>
          {FORUM_CATS.map(([k, l]) => <button key={k} className={`fcat${cat === k ? " on" : ""}`} onClick={() => setCat(k)}>{l}</button>)}
        </div>

        {loading ? <p className="member-note">Načítám…</p> : shown.length === 0 ? (
          <div className="acct-card mc-gate"><MessagesSquare size={30} /><h2>Zatím tu nikdo nepíše</h2>
            <p>Buďte první — založte téma a nakopněte diskuzi.</p>
            <button className="btn btn-green" onClick={newThread}><Plus size={16} /> Nové téma</button></div>
        ) : (
          <div className="fthreads">
            {shown.map((t) => (
              <Link key={t.id} href={`/forum/${t.id}`} className="fthread">
                {t.pinned && <Pin size={14} className="fpin" />}
                <div className="fthread-main">
                  <b>{t.title}</b>
                  <span className="fthread-meta">{catLabel(t.category)} · {t.author_name || "Člen"} · {fmt(t.last_at)}</span>
                </div>
                <span className="fthread-reps">{t.reply_count}<small>odpovědí</small></span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {form.open && (
        <div className="mc-modal" onClick={() => setForm({ ...form, open: false })}>
          <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
            <button className="mc-x" onClick={() => setForm({ ...form, open: false })}><X size={18} /></button>
            <h3>Nové téma</h3>
            <label>Kategorie
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {FORUM_CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>
            <label>Nadpis<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Krátce o co jde" /></label>
            <label>Text<textarea rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Napište svůj dotaz nebo zkušenost…" /></label>
            <button className="btn btn-green" disabled={busy} onClick={submit}>Založit téma</button>
          </div>
        </div>
      )}

      {gate && (
        <div className="mc-modal" onClick={() => setGate(null)}>
          <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
            <button className="mc-x" onClick={() => setGate(null)}><X size={18} /></button>
            <h3>{gate === "login" ? "Přihlaste se" : "Psaní je součást HUB+"}</h3>
            <p className="member-note">{gate === "login" ? "Pro psaní do fóra se přihlaste nebo si vytvořte účet." : "Čtení je zdarma. Zakládat témata a odpovídat můžou členové HUB+."}</p>
            <Link href={gate === "login" ? "/prihlaseni?next=/forum" : "/ucet"} className={`btn ${gate === "login" ? "btn-green" : "btn-gold"}`} style={{ width: "100%" }}>
              {gate === "login" ? <>Přihlásit se</> : <><Lock size={15} /> Chci HUB+</>}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
