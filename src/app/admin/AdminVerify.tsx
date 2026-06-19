"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BadgeCheck, ShieldQuestion } from "lucide-react";

type Row = { id: string; table: "specialists" | "venues"; name: string; kind: string; city: string | null };

export default function AdminVerify() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sb = createClient();
    const [sp, ve] = await Promise.all([
      sb.from("specialists").select("id,name,kind,city").eq("verify_requested", true).eq("verified", false),
      sb.from("venues").select("id,name,city").eq("verify_requested", true).eq("verified", false),
    ]);
    const list: Row[] = [];
    (sp.data ?? []).forEach((s: { id: string; name: string; kind: string; city: string | null }) => list.push({ id: s.id, table: "specialists", name: s.name, kind: s.kind, city: s.city }));
    (ve.data ?? []).forEach((v: { id: string; name: string; city: string | null }) => list.push({ id: v.id, table: "venues", name: v.name, kind: "venue", city: v.city }));
    setRows(list); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (r: Row, approve: boolean) => {
    setBusy(r.id);
    const sb = createClient();
    await sb.from(r.table).update(approve ? { verified: true, verify_requested: false } : { verify_requested: false }).eq("id", r.id);
    await load(); setBusy(null);
  };

  return (
    <div className="acct-card">
      <div className="acct-card-head"><ShieldQuestion size={20} /><h2>Žádosti o ověření ({rows.length})</h2></div>
      {loading ? <p className="member-note">Načítám…</p> : rows.length === 0 ? (
        <p className="member-note">Žádné čekající žádosti. Ověřit kohokoli můžeš i ručně v záložce Subjekty.</p>
      ) : (
        <div className="admin-scroll">
          <table className="admin-table">
            <thead><tr><th>Subjekt</th><th>Typ</th><th>Město</th><th>Akce</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><b>{r.name}</b></td>
                  <td>{r.table === "venues" ? "Areál" : r.kind}</td>
                  <td>{r.city || "—"}</td>
                  <td className="admin-actions">
                    <button onClick={() => act(r, true)} disabled={busy === r.id}><BadgeCheck size={14} /> Ověřit</button>
                    <button className="danger" onClick={() => act(r, false)} disabled={busy === r.id}>Zamítnout</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="member-note" style={{ marginTop: "0.8rem" }}>Ověřuj jen reálné a aktivně spravované subjekty — „Ověřeno TenisHubem" je známka důvěry, na mapě se ukazují jen ověření.</p>
    </div>
  );
}
