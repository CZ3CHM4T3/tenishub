"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";
import { CalendarDays, Plus, X, MapPin, ExternalLink, Trash2 } from "lucide-react";
import { useMe } from "@/lib/useMe";

type T = { id: string; name: string; date: string; city: string | null; category: string | null; surface: string | null; signup_url: string | null; note: string | null };
const fmt = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("cs-CZ", { weekday: "short", day: "numeric", month: "numeric", year: "numeric" });
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function TurnajeClient() {
  const supabase = useMemo(() => createClient(), []);
  const { isAdmin } = useMe();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [past, setPast] = useState(false);
  const [form, setForm] = useState<{ open: boolean; name: string; date: string; city: string; category: string; surface: string; signup_url: string; note: string }>({ open: false, name: "", date: "", city: "", category: "", surface: "", signup_url: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [impUrl, setImpUrl] = useState("");
  const [impMsg, setImpMsg] = useState<string | null>(null);
  const [impOpen, setImpOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("tournaments").select("id,name,date,city,category,surface,signup_url,note").order("date");
    setItems((data as T[]) ?? []);
    setLoading(false);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.name.trim() || !form.date) return;
    setBusy(true);
    const { error } = await supabase.from("tournaments").insert({
      name: form.name.trim(), date: form.date, city: form.city || null, category: form.category || null,
      surface: form.surface || null, signup_url: form.signup_url || null, note: form.note || null,
    });
    setBusy(false);
    if (error) { alert("Nepodařilo se uložit: " + error.message); return; }
    setForm({ open: false, name: "", date: "", city: "", category: "", surface: "", signup_url: "", note: "" });
    await load();
  };
  const del = async (id: string) => { if (!confirm("Smazat turnaj?")) return; await supabase.from("tournaments").delete().eq("id", id); await load(); };

  const importSvaz = async () => {
    if (!impUrl.trim()) { setImpMsg("Vlož odkaz na výpis turnajů z cesky-tenis.cz."); return; }
    setImpMsg("Načítám ze svazu…");
    try {
      const r = await fetch(`/api/turnaje-import?url=${encodeURIComponent(impUrl.trim())}`);
      const d = await r.json();
      if (!r.ok) { setImpMsg(d.error || "Import selhal."); return; }
      type IT = { extId: string; date: string; name: string; category: string | null; fee: string | null; url: string | null };
      const list = (d.tournaments as IT[]) ?? [];
      const ex = await supabase.from("tournaments").select("ext_id").not("ext_id", "is", null);
      const have = new Set((ex.data ?? []).map((x: { ext_id: string }) => x.ext_id));
      const rows = list.filter((t) => !have.has(t.extId)).map((t) => ({
        name: t.name, date: t.date, category: t.category, signup_url: t.url,
        note: t.fee ? `Vstupné ${t.fee} Kč` : null, ext_id: t.extId,
      }));
      if (rows.length) { const { error } = await supabase.from("tournaments").insert(rows); if (error) { setImpMsg("Uložení selhalo: " + error.message); return; } }
      setImpMsg(`Hotovo — nalezeno ${list.length}, nově přidáno ${rows.length}.`);
      setImpUrl("");
      await load();
    } catch { setImpMsg("Spojení selhalo (import běží až nasazené)."); }
  };

  const cities = [...new Set(items.map((t) => t.city).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "cs"));
  const t0 = todayISO();
  const shown = items.filter((t) => (past ? true : t.date >= t0) && (!city || t.city === city));

  return (
    <div className="acct-page">
      <header className="subhdr"><div className="wrap"><div className="bar">
        <Link href="/" className="brand"><Wordmark /></Link>
        <Link href="/rodic" className="back">← Rodič &amp; dítě</Link>
      </div></div></header>

      <div className="wrap acct-wrap" style={{ maxWidth: 820 }}>
        <div className="mc-head">
          <h1 className="acct-h1"><CalendarDays size={26} style={{ verticalAlign: "-4px" }} /> Kalendář turnajů</h1>
          {isAdmin && <button className="btn btn-green" onClick={() => setForm({ ...form, open: true })}><Plus size={16} /> Přidat turnaj</button>}
        </div>
        <p className="member-note" style={{ marginTop: "-0.4rem" }}>Nadcházející turnaje — termín, místo a odkaz na přihlášku.{isAdmin && <> · <button className="linklike" onClick={() => setImpOpen((v) => !v)}>Importovat ze svazu</button></>}</p>

        {isAdmin && impOpen && (
          <div className="mc-sync" style={{ marginBottom: "1rem" }}>
            <span className="mc-setlbl">Import turnajů z cesky-tenis.cz</span>
            <div className="mc-syncrow">
              <input value={impUrl} onChange={(e) => setImpUrl(e.target.value)} placeholder="Vlož odkaz na výpis (např. …/jednotlivci/mladsi-zactvo?region=…)" />
              <button type="button" className="btn btn-green" onClick={importSvaz}>Načíst</button>
            </div>
            {impMsg && <p className="mc-syncmsg">{impMsg}</p>}
            <p className="member-note" style={{ margin: "2px 0 0" }}>Na cesky-tenis.cz si v sekci Jednotlivci vyfiltruj region/kategorii, zkopíruj odkaz z prohlížeče sem a dej Načíst. Opakovaně nepřidá duplicity.</p>
          </div>
        )}

        <div className="fcats">
          <button className={`fcat${city === "" ? " on" : ""}`} onClick={() => setCity("")}>Vše</button>
          {cities.map((c) => <button key={c} className={`fcat${city === c ? " on" : ""}`} onClick={() => setCity(c)}>{c}</button>)}
          <button className={`fcat${past ? " on" : ""}`} style={{ marginLeft: "auto" }} onClick={() => setPast((p) => !p)}>{past ? "Skrýt proběhlé" : "I proběhlé"}</button>
        </div>

        {loading ? <p className="member-note">Načítám…</p> : shown.length === 0 ? (
          <div className="acct-card mc-gate"><CalendarDays size={30} /><h2>Žádné turnaje</h2><p>Zatím tu nic není{isAdmin ? " — přidejte první." : "."}</p></div>
        ) : (
          <div className="turnaje">
            {shown.map((t) => (
              <div className="turnaj" key={t.id}>
                <div className="turnaj-date"><b>{new Date(t.date + "T00:00:00").getDate()}.{new Date(t.date + "T00:00:00").getMonth() + 1}.</b><span>{new Date(t.date + "T00:00:00").getFullYear()}</span></div>
                <div className="turnaj-main">
                  <b>{t.name}</b>
                  <span className="turnaj-meta">{[t.city, t.category, t.surface].filter(Boolean).join(" · ")}{!t.city && !t.category && !t.surface ? fmt(t.date) : ""}</span>
                  {t.note && <span className="turnaj-note">{t.note}</span>}
                </div>
                {t.signup_url && <a href={t.signup_url} target="_blank" rel="noopener noreferrer" className="btn btn-out btn-sm">Přihláška <ExternalLink size={13} /></a>}
                {isAdmin && <button className="linklike danger" onClick={() => del(t.id)}><Trash2 size={15} /></button>}
              </div>
            ))}
          </div>
        )}
      </div>

      {form.open && (
        <div className="mc-modal" onClick={() => setForm({ ...form, open: false })}>
          <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
            <button className="mc-x" onClick={() => setForm({ ...form, open: false })}><X size={18} /></button>
            <h3>Přidat turnaj</h3>
            <label>Název<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <div className="mc-row2">
              <label>Datum<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
              <label>Město<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Praha" /></label>
            </div>
            <div className="mc-row2">
              <label>Kategorie<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="ml. žactvo…" /></label>
              <label>Povrch<input value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })} placeholder="antuka / hala" /></label>
            </div>
            <label>Odkaz na přihlášku<input value={form.signup_url} onChange={(e) => setForm({ ...form, signup_url: e.target.value })} placeholder="https://…" /></label>
            <label>Poznámka<input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
            <button className="btn btn-green" disabled={busy} onClick={submit}>Uložit turnaj</button>
          </div>
        </div>
      )}
    </div>
  );
}
