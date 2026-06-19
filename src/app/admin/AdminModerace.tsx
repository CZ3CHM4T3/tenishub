"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShieldAlert, Trash2, EyeOff, Eye } from "lucide-react";

type Tab = "forum" | "poradna" | "bazar";
type Item = { id: string; hidden: boolean; title: string; sub: string; body: string };

const TABS: [Tab, string][] = [["forum", "Fórum"], ["poradna", "Poradna"], ["bazar", "Bazar"]];

export default function AdminModerace() {
  const [tab, setTab] = useState<Tab>("forum");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const table = tab === "forum" ? "forum_threads" : tab === "poradna" ? "advice" : "bazar_listings";

  const load = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    const { data } = await sb.from(table).select("*").order("created_at", { ascending: false }).limit(100);
    const mapped: Item[] = (data ?? []).map((r: Record<string, unknown>) => {
      if (tab === "forum") return { id: r.id as string, hidden: !!r.hidden, title: (r.title as string) || "—", sub: `${r.author_name ?? "?"} · ${r.category ?? ""}`, body: (r.body as string) || "" };
      if (tab === "poradna") return { id: r.id as string, hidden: !!r.hidden, title: (r.body as string)?.slice(0, 60) || "—", sub: `${r.author_name ?? "?"}${r.answer ? " · zodpovězeno" : " · čeká"}`, body: (r.answer as string) || (r.body as string) || "" };
      return { id: r.id as string, hidden: !!r.hidden, title: (r.title as string) || "—", sub: `${r.author_name ?? "?"} · ${r.kind ?? ""} · ${r.city ?? ""}`, body: (r.body as string) || "" };
    });
    setItems(mapped); setLoading(false);
  }, [table, tab]);
  useEffect(() => { load(); }, [load]);

  const toggle = async (it: Item) => { setBusy(it.id); const sb = createClient(); await sb.from(table).update({ hidden: !it.hidden }).eq("id", it.id); await load(); setBusy(null); };
  const del = async (it: Item) => { if (!confirm("Opravdu smazat? Nevratné.")) return; setBusy(it.id); const sb = createClient(); await sb.from(table).delete().eq("id", it.id); await load(); setBusy(null); };

  return (
    <div className="acct-card">
      <div className="acct-card-head"><ShieldAlert size={20} /><h2>Moderace obsahu</h2></div>
      <div className="admin-tabs" style={{ margin: "0.2rem 0 1rem" }}>
        {TABS.map(([k, l]) => <button key={k} className={`atab${tab === k ? " on" : ""}`} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {loading ? <p className="member-note">Načítám…</p> : items.length === 0 ? (
        <p className="member-note">Žádný obsah.</p>
      ) : (
        <div className="mod-list">
          {items.map((it) => (
            <div className={`mod-item${it.hidden ? " hidden" : ""}`} key={it.id}>
              <div className="mod-main">
                <b>{it.title}{it.hidden && <span className="nomember" style={{ marginLeft: 6 }}>skryto</span>}</b>
                <span className="mod-sub">{it.sub}</span>
                <span className="mod-body">{it.body.slice(0, 160)}</span>
              </div>
              <div className="mod-actions">
                <button onClick={() => toggle(it)} disabled={busy === it.id}>{it.hidden ? <><Eye size={14} /> Zobrazit</> : <><EyeOff size={14} /> Skrýt</>}</button>
                <button className="danger" onClick={() => del(it)} disabled={busy === it.id}><Trash2 size={14} /> Smazat</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="member-note" style={{ marginTop: "0.8rem" }}>„Skrýt" stáhne příspěvek z webu (jde vrátit). „Smazat" je nevratné. Zobrazeno posledních 100.</p>
    </div>
  );
}
