"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search } from "lucide-react";

type Subj = {
  id: string; table: "specialists" | "venues"; name: string; kind: string;
  city: string | null; verified: boolean; status: string; reviews_count: number;
};
type Filter = "all" | "verified" | "unverified" | "hidden";

const KIND_LABEL: Record<string, string> = {
  coach: "Trenér", physio: "Fyzio", fitness: "Kondiční", academy: "Škola", stringer: "Vyplétač", venue: "Areál",
};
const ADD_KINDS: [string, string][] = [
  ["coach", "Tenisový trenér"], ["physio", "Fyzioterapeut"], ["fitness", "Kondiční trenér"],
  ["academy", "Tenisová škola / akademie"], ["stringer", "Vyplétač"], ["venue", "Areál / klub"],
];

export default function AdminSubjects() {
  const [items, setItems] = useState<Subj[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [nf, setNf] = useState({ kind: "coach", name: "", city: "" });

  const load = useCallback(async () => {
    const sb = createClient();
    const [sp, ve] = await Promise.all([
      sb.from("specialists").select("id,name,kind,city,verified,status,reviews_count").order("name"),
      sb.from("venues").select("id,name,city,verified,status,reviews_count").order("name"),
    ]);
    const list: Subj[] = [];
    (sp.data ?? []).forEach((s: { id: string; name: string; kind: string; city: string | null; verified: boolean; status: string; reviews_count: number }) =>
      list.push({ id: s.id, table: "specialists", name: s.name, kind: s.kind, city: s.city, verified: s.verified, status: s.status, reviews_count: s.reviews_count }));
    (ve.data ?? []).forEach((v: { id: string; name: string; city: string | null; verified: boolean; status: string; reviews_count: number }) =>
      list.push({ id: v.id, table: "venues", name: v.name, kind: "venue", city: v.city, verified: v.verified, status: v.status, reviews_count: v.reviews_count }));
    list.sort((a, b) => Number(b.verified) - Number(a.verified) || a.name.localeCompare(b.name, "cs"));
    setItems(list);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (s: Subj, patch: Record<string, unknown>) => {
    setBusy(s.id);
    const sb = createClient();
    await sb.from(s.table).update(patch).eq("id", s.id);
    await load(); setBusy(null);
  };
  const remove = async (s: Subj) => {
    if (!confirm(`Opravdu smazat „${s.name}"? Nevratné.`)) return;
    setBusy(s.id);
    const sb = createClient();
    await sb.from(s.table).delete().eq("id", s.id);
    await load(); setBusy(null);
  };
  const addSubject = async () => {
    if (!nf.name.trim()) return;
    setBusy("add");
    const sb = createClient();
    if (nf.kind === "venue") {
      await sb.from("venues").insert({ name: nf.name.trim(), city: nf.city || null, status: "claimed", verified: true });
    } else {
      await sb.from("specialists").insert({ kind: nf.kind, name: nf.name.trim(), city: nf.city || null, status: "claimed", verified: true });
    }
    setNf({ kind: "coach", name: "", city: "" });
    setAdding(false);
    await load(); setBusy(null);
  };

  const shown = items.filter((s) => {
    if (filter === "verified" && !s.verified) return false;
    if (filter === "unverified" && (s.verified || s.status === "hidden")) return false;
    if (filter === "hidden" && s.status !== "hidden") return false;
    if (q && !s.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: items.length,
    verified: items.filter((s) => s.verified).length,
    unverified: items.filter((s) => !s.verified && s.status !== "hidden").length,
    hidden: items.filter((s) => s.status === "hidden").length,
  };

  return (
    <div className="acct-card">
      <div className="acct-card-head"><Search size={20} /><h2>Správa subjektů ({items.length})</h2>
        <button className="btn btn-gold" style={{ marginLeft: "auto" }} onClick={() => setAdding((v) => !v)}><Plus size={15} /> Přidat subjekt</button>
      </div>

      {adding && (
        <div className="subj-add">
          <select value={nf.kind} onChange={(e) => setNf({ ...nf, kind: e.target.value })}>
            {ADD_KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <input placeholder="Název / jméno" value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} />
          <input placeholder="Město" value={nf.city} onChange={(e) => setNf({ ...nf, city: e.target.value })} />
          <button className="btn btn-green" disabled={busy === "add"} onClick={addSubject}>Přidat (ověřený)</button>
        </div>
      )}

      <div className="subj-filters">
        {([["all", "Vše"], ["verified", "Ověřené"], ["unverified", "Neověřené"], ["hidden", "Skryté"]] as [Filter, string][]).map(([f, l]) => (
          <button key={f} className={`subj-fbtn${filter === f ? " on" : ""}`} onClick={() => setFilter(f)}>{l} <b>{counts[f]}</b></button>
        ))}
        <span className="subj-search"><Search size={14} /><input placeholder="Hledat jméno…" value={q} onChange={(e) => setQ(e.target.value)} /></span>
      </div>

      {loading ? <p className="member-note">Načítám…</p> : (
        <div className="admin-scroll">
          <table className="admin-table">
            <thead><tr><th>Název</th><th>Typ</th><th>Město</th><th>Recenze</th><th>Stav</th><th>Akce</th></tr></thead>
            <tbody>
              {shown.slice(0, 300).map((s) => (
                <tr key={s.id} style={s.status === "hidden" ? { opacity: 0.5 } : undefined}>
                  <td><b>{s.name}</b></td>
                  <td>{KIND_LABEL[s.kind] ?? s.kind}</td>
                  <td>{s.city || "—"}</td>
                  <td>{s.reviews_count}</td>
                  <td>
                    {s.status === "hidden" ? <span className="nomember">skryto</span>
                      : s.verified ? <span className="member-badge">OVĚŘENO</span>
                      : <span className="nomember">neověřeno</span>}
                  </td>
                  <td className="admin-actions">
                    {s.verified
                      ? <button onClick={() => act(s, { verified: false })} disabled={busy === s.id}>Zrušit ov.</button>
                      : <button onClick={() => act(s, { verified: true })} disabled={busy === s.id}>Ověřit</button>}
                    {s.status === "hidden"
                      ? <button onClick={() => act(s, { status: "claimed" })} disabled={busy === s.id}>Zobrazit</button>
                      : <button onClick={() => act(s, { status: "hidden" })} disabled={busy === s.id}>Skrýt</button>}
                    <button className="danger" onClick={() => remove(s)} disabled={busy === s.id}>Smazat</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="member-note" style={{ marginTop: "0.8rem" }}>
        Na mapě se ukazují jen <b>ověřené</b>. „Skrýt" stáhne subjekt i z katalogu/SEO. Zobrazeno max 300; filtruj/hledej.
      </p>
    </div>
  );
}
