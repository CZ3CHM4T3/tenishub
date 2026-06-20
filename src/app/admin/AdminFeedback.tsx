"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageSquarePlus, Star, Trash2, Eye, Archive, TrendingUp } from "lucide-react";

type FB = { id: string; created_at: string; author_name: string | null; rating: number | null; category: string | null; message: string; page: string | null; status: string };

const CAT_LABEL: Record<string, string> = { pochvala: "Pochvala", chyba: "Nefunguje", napad: "Nápad", chybi: "Chybí", jine: "Jiné" };
const fmt = (iso: string) => new Date(iso).toLocaleString("cs-CZ", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

export default function AdminFeedback({ accounts, members, signups7, signups30 }: { accounts: number; members: number; signups7: number; signups30: number }) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<FB[]>([]);
  const [visits, setVisits] = useState(0);
  const [visits7, setVisits7] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new">("new");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const [fb, v, v7] = await Promise.all([
      supabase.from("feedback").select("id,created_at,author_name,rating,category,message,page,status").order("created_at", { ascending: false }).limit(300),
      supabase.from("events").select("*", { count: "exact", head: true }).eq("kind", "visit"),
      supabase.from("events").select("*", { count: "exact", head: true }).eq("kind", "visit").gte("created_at", weekAgo),
    ]);
    setItems((fb.data as FB[]) ?? []);
    setVisits(v.count ?? 0);
    setVisits7(v7.count ?? 0);
    setLoading(false);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    await supabase.from("feedback").update({ status }).eq("id", id);
    await load(); setBusy(null);
  };
  const del = async (id: string) => {
    if (!confirm("Smazat tuto zpětnou vazbu?")) return;
    setBusy(id);
    await supabase.from("feedback").delete().eq("id", id);
    await load(); setBusy(null);
  };

  const shown = filter === "new" ? items.filter((i) => i.status === "new") : items;
  const newCount = items.filter((i) => i.status === "new").length;

  return (<>
    {/* KONVERZNÍ TRYCHTÝŘ */}
    <div className="acct-card">
      <div className="acct-card-head"><TrendingUp size={20} /><h2>Konverzní trychtýř</h2></div>
      <div className="funnel">
        <div className="funnel-step">
          <b>{visits.toLocaleString("cs-CZ")}</b><span>návštěv</span>
          <small>{visits7.toLocaleString("cs-CZ")} za 7 dní</small>
        </div>
        <div className="funnel-arrow"><span>{pct(accounts, visits)} %</span></div>
        <div className="funnel-step">
          <b>{accounts.toLocaleString("cs-CZ")}</b><span>účtů</span>
          <small>+{signups7} / 7 dní · +{signups30} / 30 dní</small>
        </div>
        <div className="funnel-arrow"><span>{pct(members, accounts)} %</span></div>
        <div className="funnel-step funnel-paid">
          <b>{members.toLocaleString("cs-CZ")}</b><span>HUB+ členů</span>
          <small>{pct(members, visits)} % z návštěv</small>
        </div>
      </div>
      <p className="member-note" style={{ marginTop: "0.8rem" }}>
        Návštěva = jeden prohlížeč za relaci. Procenta ukazují, kolik lidí postoupí dál (návštěva → registrace → placené HUB+).
      </p>
    </div>

    {/* ZPĚTNÁ VAZBA */}
    <div className="acct-card">
      <div className="acct-card-head"><MessageSquarePlus size={20} /><h2>Zpětná vazba {newCount > 0 && <span className="member-badge">{newCount} nových</span>}</h2></div>
      <div className="fcats">
        <button className={`fcat${filter === "new" ? " on" : ""}`} onClick={() => setFilter("new")}>Nové ({newCount})</button>
        <button className={`fcat${filter === "all" ? " on" : ""}`} onClick={() => setFilter("all")}>Vše ({items.length})</button>
      </div>
      {loading ? <p className="member-note">Načítám…</p> : shown.length === 0 ? (
        <p className="member-note">{filter === "new" ? "Žádná nová zpětná vazba." : "Zatím žádná zpětná vazba."}</p>
      ) : (
        <div className="fb-list">
          {shown.map((f) => (
            <div className={`fb-item${f.status === "new" ? " is-new" : ""}`} key={f.id}>
              <div className="fb-item-top">
                {f.category && <span className="fb-tag">{CAT_LABEL[f.category] ?? f.category}</span>}
                {f.rating ? <span className="fb-rate"><Star size={13} fill="currentColor" /> {f.rating}/5</span> : null}
                <span className="fb-meta">{f.author_name || "Anonym"} · {fmt(f.created_at)}{f.page ? ` · ${f.page}` : ""}</span>
                {f.status === "archived" && <span className="nomember">archiv</span>}
              </div>
              <p className="fb-msg">{f.message}</p>
              <div className="admin-actions">
                {f.status !== "read" && f.status !== "archived" && <button onClick={() => setStatus(f.id, "read")} disabled={busy === f.id}><Eye size={14} /> Přečteno</button>}
                {f.status !== "archived" && <button onClick={() => setStatus(f.id, "archived")} disabled={busy === f.id}><Archive size={14} /> Archiv</button>}
                <button className="danger" onClick={() => del(f.id)} disabled={busy === f.id}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </>);
}
