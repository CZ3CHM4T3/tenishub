"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Video, ExternalLink, Trash2, Phone, CheckCircle2 } from "lucide-react";

type VR = { id: string; created_at: string; name: string; email: string; phone: string | null; player_age: string | null; video_url: string; note: string | null; preferred_at: string | null; status: string };

const fmt = (iso: string) => new Date(iso).toLocaleString("cs-CZ", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
const STATUS: Record<string, string> = { new: "Nová", contacted: "Kontaktováno", done: "Hotovo", cancelled: "Zrušeno" };

export default function AdminVideo() {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<VR[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("video_requests").select("*").order("created_at", { ascending: false }).limit(300);
    setItems((data as VR[]) ?? []);
    setLoading(false);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string) => { setBusy(id); await supabase.from("video_requests").update({ status }).eq("id", id); await load(); setBusy(null); };
  const del = async (id: string) => { if (!confirm("Smazat objednávku?")) return; setBusy(id); await supabase.from("video_requests").delete().eq("id", id); await load(); setBusy(null); };

  const newCount = items.filter((i) => i.status === "new").length;

  return (
    <div className="acct-card">
      <div className="acct-card-head"><Video size={20} /><h2>Objednávky videorozboru {newCount > 0 && <span className="member-badge">{newCount} nových</span>}</h2></div>
      {loading ? <p className="member-note">Načítám…</p> : items.length === 0 ? (
        <p className="member-note">Zatím žádné objednávky.</p>
      ) : (
        <div className="admin-scroll">
          <table className="admin-table">
            <thead><tr><th>Kdy</th><th>Kdo</th><th>Kontakt</th><th>Video</th><th>Poznámka</th><th>Termín</th><th>Stav</th><th>Akce</th></tr></thead>
            <tbody>
              {items.map((v) => (
                <tr key={v.id}>
                  <td>{fmt(v.created_at)}</td>
                  <td><b>{v.name}</b>{v.player_age ? <div style={{ fontSize: "0.74rem", color: "var(--muted)" }}>{v.player_age}</div> : null}</td>
                  <td><a href={`mailto:${v.email}`}>{v.email}</a>{v.phone ? <div style={{ fontSize: "0.78rem" }}><Phone size={11} /> {v.phone}</div> : null}</td>
                  <td><a href={v.video_url} target="_blank" rel="noopener noreferrer" className="linklike"><ExternalLink size={13} /> video</a></td>
                  <td style={{ maxWidth: 220 }}>{v.note || "—"}</td>
                  <td>{v.preferred_at || "—"}</td>
                  <td>{v.status === "new" ? <span className="member-badge">Nová</span> : <span className="nomember">{STATUS[v.status] ?? v.status}</span>}</td>
                  <td className="admin-actions">
                    {v.status !== "contacted" && <button onClick={() => setStatus(v.id, "contacted")} disabled={busy === v.id}><Phone size={13} /> Kontakt.</button>}
                    {v.status !== "done" && <button onClick={() => setStatus(v.id, "done")} disabled={busy === v.id}><CheckCircle2 size={13} /> Hotovo</button>}
                    <button className="danger" onClick={() => del(v.id)} disabled={busy === v.id}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
