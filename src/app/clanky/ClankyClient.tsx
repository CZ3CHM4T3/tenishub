"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";
import { BookOpen, Plus, X } from "lucide-react";
import { useMe } from "@/lib/useMe";

type Article = { id: string; slug: string; title: string; perex: string | null; category: string; author_name: string | null; created_at: string };

const CATS: [string, string][] = [
  ["navody", "Návody"], ["vyber", "Jak vybrat"], ["turnaje", "Turnaje"],
  ["zdravi", "Zdraví a kondice"], ["hlava", "Psychika a motivace"], ["ostatni", "Ostatní"],
];
const catLabel = (k: string) => CATS.find(([v]) => v === k)?.[1] ?? "Ostatní";
const fmt = (iso: string) => new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });
const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "clanek";

export default function ClankyClient() {
  const supabase = useMemo(() => createClient(), []);
  const { me, isAdmin } = useMe();
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("");
  const [form, setForm] = useState<{ open: boolean; title: string; category: string; perex: string; body: string }>({ open: false, title: "", category: "navody", perex: "", body: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("articles").select("id,slug,title,perex,category,author_name,created_at").order("created_at", { ascending: false }).limit(200);
    setItems((data as Article[]) ?? []);
    setLoading(false);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!me || !form.title.trim() || !form.body.trim()) return;
    setBusy(true);
    const slug = `${slugify(form.title)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase.from("articles").insert({
      slug, title: form.title.trim(), category: form.category, perex: form.perex || null, body: form.body.trim(), author_name: me.name,
    }).select("slug").single();
    setBusy(false);
    if (error) { alert("Nepodařilo se uložit: " + error.message); return; }
    if (data) window.location.href = `/clanky/${data.slug}`;
  };

  const shown = cat ? items.filter((a) => a.category === cat) : items;

  return (
    <div className="acct-page">
      <header className="subhdr"><div className="wrap"><div className="bar">
        <Link href="/" className="brand"><Wordmark /></Link>
        <Link href="/rodic" className="back">← Rodič &amp; dítě</Link>
      </div></div></header>

      <div className="wrap acct-wrap">
        <div className="mc-head">
          <h1 className="acct-h1"><BookOpen size={26} style={{ verticalAlign: "-4px" }} /> Knihovna článků</h1>
          {isAdmin && <button className="btn btn-green" onClick={() => setForm({ open: true, title: "", category: "navody", perex: "", body: "" })}><Plus size={16} /> Nový článek</button>}
        </div>
        <p className="member-note" style={{ marginTop: "-0.4rem" }}>Praktické návody pro tenisové rodiče. Vybíráme jen ověřené rady.</p>

        <div className="fcats">
          <button className={`fcat${cat === "" ? " on" : ""}`} onClick={() => setCat("")}>Vše</button>
          {CATS.map(([k, l]) => <button key={k} className={`fcat${cat === k ? " on" : ""}`} onClick={() => setCat(k)}>{l}</button>)}
        </div>

        {loading ? <p className="member-note">Načítám…</p> : shown.length === 0 ? (
          <div className="acct-card mc-gate"><BookOpen size={30} /><h2>Knihovna se plní</h2><p>Brzy tu najdete návody. {isAdmin && "Přidejte první článek."}</p></div>
        ) : (
          <div className="clanky-grid">
            {shown.map((a) => (
              <Link key={a.id} href={`/clanky/${a.slug}`} className="clanek-card">
                <span className="clanek-cat">{catLabel(a.category)}</span>
                <b>{a.title}</b>
                {a.perex && <span className="clanek-perex">{a.perex}</span>}
                <span className="clanek-meta">{a.author_name || "TenisHub"} · {fmt(a.created_at)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {form.open && (
        <div className="mc-modal" onClick={() => setForm({ ...form, open: false })}>
          <div className="mc-modal-in mc-modal-wide" onClick={(e) => e.stopPropagation()}>
            <button className="mc-x" onClick={() => setForm({ ...form, open: false })}><X size={18} /></button>
            <h3>Nový článek</h3>
            <label>Nadpis<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label>Kategorie<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            <label>Perex (krátké shrnutí)<input value={form.perex} onChange={(e) => setForm({ ...form, perex: e.target.value })} /></label>
            <label>Text článku<textarea rows={10} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Odstavce oddělte prázdným řádkem." /></label>
            <button className="btn btn-green" disabled={busy} onClick={submit}>Publikovat</button>
          </div>
        </div>
      )}
    </div>
  );
}
