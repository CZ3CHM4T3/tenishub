"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Library, Plus, X, BookOpen, SlidersHorizontal, Trophy, HeartPulse, Brain, Tag, Pencil, type LucideIcon } from "lucide-react";
import { useMe } from "@/lib/useMe";
import { RichEditor } from "@/components/RichEditor";

type Article = { id: string; slug: string; title: string; perex: string | null; category: string; author_name: string | null; created_at: string; is_sample: boolean; cover_url: string | null };

// Kategorie: barva + jednoduchá ikonka (aby šly články rozeznat na první pohled).
const CATS: { k: string; l: string; c: string; Icon: LucideIcon }[] = [
  { k: "navody", l: "Návody", c: "#2f7d54", Icon: BookOpen },
  { k: "vyber", l: "Jak vybrat", c: "#3670a8", Icon: SlidersHorizontal },
  { k: "turnaje", l: "Turnaje", c: "#b0862c", Icon: Trophy },
  { k: "zdravi", l: "Zdraví a kondice", c: "#2f8f7a", Icon: HeartPulse },
  { k: "hlava", l: "Psychika a motivace", c: "#6a52c8", Icon: Brain },
  { k: "ostatni", l: "Ostatní", c: "#5a6470", Icon: Tag },
];
const catMeta = (k: string) => CATS.find((x) => x.k === k) ?? CATS[CATS.length - 1];
const fmt = (iso: string) => new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });
const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "clanek";

export default function ClankyClient() {
  const supabase = useMemo(() => createClient(), []);
  const { me, isAdmin, canPost } = useMe();
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("");
  const [form, setForm] = useState<{ open: boolean; id?: string; title: string; category: string; perex: string; body: string; sample: boolean }>({ open: false, title: "", category: "navody", perex: "", body: "", sample: false });
  const [busy, setBusy] = useState(false);
  const newArticle = () => setForm({ open: true, id: undefined, title: "", category: "navody", perex: "", body: "", sample: false });
  const editArticle = async (id: string) => {
    const { data } = await supabase.from("articles").select("id,slug,title,category,perex,body,is_sample").eq("id", id).single();
    if (data) setForm({ open: true, id: data.id, title: data.title, category: data.category, perex: data.perex ?? "", body: data.body ?? "", sample: data.is_sample });
  };

  const load = useCallback(async () => {
    const { data } = await supabase.from("articles").select("id,slug,title,perex,category,author_name,created_at,is_sample,cover_url").order("created_at", { ascending: false }).limit(200);
    setItems((data as Article[]) ?? []);
    setLoading(false);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!me || !form.title.trim() || !form.body.trim()) return;
    setBusy(true);
    if (form.id) {
      // úprava existujícího
      const { error } = await supabase.from("articles").update({
        title: form.title.trim(), category: form.category, perex: form.perex || null, body: form.body, is_sample: form.sample,
      }).eq("id", form.id);
      setBusy(false);
      if (error) { alert("Nepodařilo se uložit: " + error.message); return; }
      setForm({ ...form, open: false }); load();
      return;
    }
    const slug = `${slugify(form.title)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase.from("articles").insert({
      slug, title: form.title.trim(), category: form.category, perex: form.perex || null, body: form.body, author_name: me.name, is_sample: form.sample,
    }).select("slug").single();
    setBusy(false);
    if (error) { alert("Nepodařilo se uložit: " + error.message); return; }
    if (data) window.location.href = `/clanky/${data.slug}`;
  };

  const shown = cat ? items.filter((a) => a.category === cat) : items;

  return (
    <div className="acct-page">
      <SiteHeader />

      <div className="wrap acct-wrap">
        <div className="mc-head">
          <h1 className="acct-h1"><Library size={26} style={{ verticalAlign: "-4px" }} /> Knihovna</h1>
          {isAdmin && <button className="btn btn-green" onClick={newArticle}><Plus size={16} /> Nový článek</button>}
        </div>
        <p className="clanky-intro">Praktické návody a rady pro tenisové rodiče i trenéry. Ukázky jsou zdarma, celá knihovna pro členy. A protože nejsme jediný chytrý zdroj — mrkni i na <Link href="/zdroje" className="clanky-intro-link">Zdroje →</Link></p>

        <div className="fcats">
          <button className={`fcat${cat === "" ? " on" : ""}`} onClick={() => setCat("")}>Vše</button>
          {CATS.map((x) => {
            const on = cat === x.k;
            return (
              <button key={x.k} className={`fcat fcat-c${on ? " on" : ""}`} onClick={() => setCat(x.k)}
                style={on ? { background: x.c, borderColor: x.c, color: "#fff" } : { color: x.c, borderColor: "#e4dfd1" }}>
                <x.Icon size={14} /> {x.l}
              </button>
            );
          })}
        </div>

        {loading ? <p className="member-note">Načítám…</p> : shown.length === 0 ? (
          <div className="acct-card mc-gate"><Library size={30} /><h2>Knihovna se plní</h2><p>Brzy tu najdete návody a rady. {isAdmin && "Přidejte první článek."}</p></div>
        ) : (
          <div className="clanky-grid">
            {shown.map((a) => {
              const m = catMeta(a.category);
              return (
                <div key={a.id} className="clanek-card-wrap">
                  <Link href={`/clanky/${a.slug}`} className="clanek-card" style={{ borderTop: `3px solid ${m.c}` }}>
                    <span className="clanek-cover" style={a.cover_url ? { backgroundImage: `url(${a.cover_url})` } : { background: `color-mix(in srgb, ${m.c} 12%, #fff)` }}>
                      {!a.cover_url && <m.Icon size={30} style={{ color: m.c, opacity: 0.55 }} />}
                    </span>
                    <span className="clanek-cbody">
                      <span className="clanek-cardtop">
                        <span className="clanek-cat" style={{ color: m.c }}><m.Icon size={12} style={{ verticalAlign: "-2px" }} /> {m.l}</span>
                        {a.is_sample ? <span className="clanek-badge free">Ukázka zdarma</span> : (!canPost ? <span className="clanek-badge lock">Pro členy</span> : null)}
                      </span>
                      <b>{a.title}</b>
                      {a.perex && <span className="clanek-perex">{a.perex}</span>}
                      <span className="clanek-meta">{a.author_name || "TenisHub"} · {fmt(a.created_at)}</span>
                    </span>
                  </Link>
                  {isAdmin && <button className="clanek-edit" title="Upravit článek" onClick={() => editArticle(a.id)}><Pencil size={14} /></button>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {form.open && (
        <div className="mc-modal" onClick={() => setForm({ ...form, open: false })}>
          <div className="mc-modal-in mc-modal-wide" onClick={(e) => e.stopPropagation()}>
            <button className="mc-x" onClick={() => setForm({ ...form, open: false })}><X size={18} /></button>
            <h3>{form.id ? "Upravit článek" : "Nový článek"}</h3>
            <label>Nadpis<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label>Kategorie<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATS.map((x) => <option key={x.k} value={x.k}>{x.l}</option>)}</select></label>
            <label>Perex (krátké shrnutí)<input value={form.perex} onChange={(e) => setForm({ ...form, perex: e.target.value })} /></label>
            <label>Text článku</label>
            <RichEditor value={form.body} resetKey={form.id ?? "new"} onChange={(html) => setForm((f) => ({ ...f, body: html }))} />
            <label className="clanek-samplechk"><input type="checkbox" checked={form.sample} onChange={(e) => setForm({ ...form, sample: e.target.checked })} /> Ukázka zdarma (celý článek uvidí i nečlenové)</label>
            <button className="btn btn-green" disabled={busy} onClick={submit}>{form.id ? "Uložit změny" : "Publikovat"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
