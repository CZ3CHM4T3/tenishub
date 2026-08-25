"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Compass, Plus, X, ExternalLink, Mic, FileText, Video, Globe, BookMarked } from "lucide-react";
import { useMe } from "@/lib/useMe";

type Zdroj = { id: string; title: string; url: string; kind: string; note: string | null };

const KINDS: [string, string][] = [
  ["podcast", "Podcasty"], ["clanek", "Články a weby"], ["video", "Videa"], ["kniha", "Knihy"], ["web", "Weby a nástroje"],
];
const kindLabel = (k: string) => KINDS.find(([v]) => v === k)?.[1] ?? "Ostatní";
const KIcon = ({ k }: { k: string }) => k === "podcast" ? <Mic size={16} /> : k === "video" ? <Video size={16} /> : k === "kniha" ? <BookMarked size={16} /> : k === "clanek" ? <FileText size={16} /> : <Globe size={16} />;

export default function ZdrojeClient() {
  const supabase = useMemo(() => createClient(), []);
  const { isAdmin } = useMe();
  const [items, setItems] = useState<Zdroj[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ open: boolean; title: string; url: string; kind: string; note: string }>({ open: false, title: "", url: "", kind: "podcast", note: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("zdroje").select("id,title,url,kind,note").order("created_at", { ascending: false });
    setItems((data as Zdroj[]) ?? []);
    setLoading(false);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.title.trim() || !form.url.trim()) return;
    setBusy(true);
    const url = form.url.trim().startsWith("http") ? form.url.trim() : `https://${form.url.trim()}`;
    const { error } = await supabase.from("zdroje").insert({ title: form.title.trim(), url, kind: form.kind, note: form.note || null });
    setBusy(false);
    if (error) { alert("Nepodařilo se uložit: " + error.message); return; }
    setForm({ open: false, title: "", url: "", kind: "podcast", note: "" });
    load();
  };

  const byKind = KINDS.map(([k, l]) => [k, l, items.filter((z) => z.kind === k)] as [string, string, Zdroj[]]).filter(([, , arr]) => arr.length > 0);

  return (
    <div className="acct-page">
      <SiteHeader />
      <div className="wrap acct-wrap" style={{ maxWidth: 820 }}>
        <div className="mc-head">
          <h1 className="acct-h1"><Compass size={26} style={{ verticalAlign: "-4px" }} /> Zdroje</h1>
          {isAdmin && <button className="btn btn-green" onClick={() => setForm({ ...form, open: true })}><Plus size={16} /> Přidat zdroj</button>}
        </div>
        <p className="member-note" style={{ marginTop: "-0.4rem" }}>
          Nejsme jediný chytrý zdroj — a jsme za to rádi. Dobrý tenisový rodič i trenér čerpá z víc míst.
          Tady sbíráme tipy na <b>podcasty, články, videa a knihy</b>, které stojí za váš čas.
        </p>

        {loading ? <p className="member-note">Načítám…</p> : items.length === 0 ? (
          <div className="acct-card mc-gate"><Compass size={30} /><h2>Tipy přidáváme průběžně</h2><p>Brzy tu najdete vybrané zdroje o tenise. {isAdmin && "Přidejte první tip."}</p></div>
        ) : (
          <div className="zdroje-wrap">
            {byKind.map(([k, l, arr]) => (
              <section className="zdroje-sec" key={k}>
                <h2 className="zdroje-h"><span className="zdroje-h-ic"><KIcon k={k} /></span> {l}</h2>
                <div className="zdroje-list">
                  {arr.map((z) => (
                    <a key={z.id} href={z.url} target="_blank" rel="noopener noreferrer nofollow" className="zdroj">
                      <div className="zdroj-tx"><b>{z.title}</b>{z.note && <span>{z.note}</span>}</div>
                      <ExternalLink size={16} className="zdroj-arr" />
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {form.open && (
        <div className="mc-modal" onClick={() => setForm({ ...form, open: false })}>
          <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
            <button className="mc-x" onClick={() => setForm({ ...form, open: false })}><X size={18} /></button>
            <h3>Přidat zdroj</h3>
            <label>Název<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Např. Tenisový podcast XY" /></label>
            <label>Odkaz (URL)<input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" /></label>
            <label>Typ<select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>{KINDS.map(([k, l]) => <option key={k} value={k}>{kindLabel(k)}</option>)}</select></label>
            <label>Krátká poznámka (nepovinné)<input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Čím je zajímavý" /></label>
            <button className="btn btn-green" disabled={busy || !form.title.trim() || !form.url.trim()} onClick={submit}>Přidat</button>
          </div>
        </div>
      )}
    </div>
  );
}
