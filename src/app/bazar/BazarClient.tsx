"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Repeat, Plus, X, Lock, Trash2, MapPin } from "lucide-react";
import { useMe } from "@/lib/useMe";

type Kind = "bazar" | "spolujizda";
type L = { id: string; kind: Kind; author_id: string | null; author_name: string | null; title: string; category: string | null; city: string | null; price: string | null; body: string | null; contact: string | null; created_at: string };

const BAZAR_CATS = ["Raketa", "Boty", "Oblečení", "Doplňky", "Ostatní"];
const fmt = (iso: string) => new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });

export default function BazarClient() {
  const supabase = useMemo(() => createClient(), []);
  const { me, canPost } = useMe();
  const [tab, setTab] = useState<Kind>("bazar");
  const [items, setItems] = useState<L[]>([]);
  const [loading, setLoading] = useState(true);
  const [gate, setGate] = useState<null | "login" | "hub">(null);
  const [form, setForm] = useState({ open: false, title: "", category: "Raketa", city: "", price: "", body: "", contact: "" });
  const [busy, setBusy] = useState(false);
  const isBazar = tab === "bazar";

  const load = useCallback(async () => {
    const { data } = await supabase.from("bazar_listings").select("*").order("created_at", { ascending: false }).limit(300);
    setItems((data as L[]) ?? []);
    setLoading(false);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "spolujizda") setTab("spolujizda"); }, []);

  const add = () => {
    if (!me) { setGate("login"); return; }
    if (!canPost) { setGate("hub"); return; }
    setForm({ open: true, title: "", category: "Raketa", city: "", price: "", body: "", contact: "" });
  };
  const submit = async () => {
    if (!me || !form.title.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("bazar_listings").insert({
      kind: tab, author_id: me.id, author_name: me.name, title: form.title.trim(),
      category: isBazar ? form.category : null, city: form.city || null,
      price: form.price || null, body: form.body || null, contact: form.contact || null,
    });
    setBusy(false);
    if (error) { alert("Nepodařilo se přidat: " + error.message); return; }
    setForm({ ...form, open: false });
    await load();
  };
  const del = async (id: string) => { if (!confirm("Smazat inzerát?")) return; await supabase.from("bazar_listings").delete().eq("id", id); await load(); };

  const shown = items.filter((l) => l.kind === tab);
  const titleLabel = isBazar ? "Co prodáváte" : "Odkud a kam";
  const titlePh = isBazar ? "Raketa Wilson…" : "Praha - turnaj Beroun, so 14.6.";
  const priceLabel = isBazar ? "Cena" : "Volných míst";

  return (
    <div className="acct-page">
      <SiteHeader />

      <div className="wrap acct-wrap" style={{ maxWidth: 880 }}>
        <div className="mc-head">
          <h1 className="acct-h1"><Repeat size={26} style={{ verticalAlign: "-4px" }} /> Bazar a spolujízda</h1>
          <button className="btn btn-green" onClick={add}><Plus size={16} /> {isBazar ? "Přidat inzerát" : "Nabídnout odvoz"}</button>
        </div>

        <div className="fcats">
          <button className={`fcat${isBazar ? " on" : ""}`} onClick={() => setTab("bazar")}>Bazar vybavení</button>
          <button className={`fcat${!isBazar ? " on" : ""}`} onClick={() => setTab("spolujizda")}>Spolujízda</button>
        </div>
        <p className="member-note" style={{ marginTop: "-0.6rem" }}>{isBazar ? "Vybavení z druhé ruky mezi rodiči. Přidávat můžou členové HUB+." : "Nabídněte nebo najděte odvoz na trénink či turnaj. Přidávat můžou členové HUB+."}</p>

        {loading ? <p className="member-note">Načítám…</p> : shown.length === 0 ? (
          <div className="acct-card mc-gate"><Repeat size={30} /><h2>Zatím tu nic není</h2><p>Buďte první.</p></div>
        ) : (
          <div className="bazar-grid">
            {shown.map((l) => (
              <div className="bazar-card" key={l.id}>
                <div className="bazar-top">
                  {isBazar && l.category ? <span className="bazar-cat">{l.category}</span> : <span />}
                  {l.price ? <span className="bazar-price">{l.price}{!isBazar ? " míst" : ""}</span> : null}
                </div>
                <b>{l.title}</b>
                {l.city ? <span className="bazar-city"><MapPin size={13} /> {l.city}</span> : null}
                {l.body ? <p className="bazar-body">{l.body}</p> : null}
                <div className="bazar-foot">
                  <span>{l.author_name || "Rodič"} · {fmt(l.created_at)}</span>
                  {l.contact ? <span className="bazar-contact">{l.contact}</span> : null}
                  {me && l.author_id === me.id ? <button className="linklike danger" onClick={() => del(l.id)}><Trash2 size={14} /></button> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {form.open && (
        <div className="mc-modal" onClick={() => setForm({ ...form, open: false })}>
          <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
            <button className="mc-x" onClick={() => setForm({ ...form, open: false })}><X size={18} /></button>
            <h3>{isBazar ? "Nový inzerát" : "Nabídnout odvoz"}</h3>
            <label>{titleLabel}
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={titlePh} />
            </label>
            {isBazar ? (
              <label>Kategorie
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {BAZAR_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
            ) : null}
            <div className="mc-row2">
              <label>Město / oblast<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
              <label>{priceLabel}<input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
            </div>
            <label>Popis<textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>
            <label>Kontakt (telefon / e-mail)<input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></label>
            <button className="btn btn-green" disabled={busy} onClick={submit}>Zveřejnit</button>
          </div>
        </div>
      )}

      {gate && (
        <div className="mc-modal" onClick={() => setGate(null)}>
          <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
            <button className="mc-x" onClick={() => setGate(null)}><X size={18} /></button>
            <h3>{gate === "login" ? "Přihlaste se" : "Přidávání je součást HUB+"}</h3>
            <p className="member-note">{gate === "login" ? "Pro přidání se přihlaste." : "Prohlížet můžou všichni. Přidávat inzeráty a odvozy můžou členové HUB+."}</p>
            <Link href={gate === "login" ? "/prihlaseni?next=/bazar" : "/ucet"} className={`btn ${gate === "login" ? "btn-green" : "btn-gold"}`} style={{ width: "100%" }}>{gate === "login" ? "Přihlásit se" : <><Lock size={15} /> Chci HUB+</>}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
