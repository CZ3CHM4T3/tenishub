"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Msg = { id: string; name: string | null; email: string | null; body: string; status: string; created_at: string };
const fmt = (iso: string) => new Date(iso).toLocaleString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function AdminDotazy() {
  const supabase = useMemo(() => createClient(), []);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from("contact_messages").select("id,name,email,body,status,created_at").order("created_at", { ascending: false }).limit(300);
    setMsgs((data as Msg[]) ?? []);
    setLoading(false);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string) => {
    setMsgs((m) => m.map((x) => (x.id === id ? { ...x, status } : x)));
    await supabase.from("contact_messages").update({ status }).eq("id", id);
  };

  if (loading) return <p className="admin-tabdesc">Načítám dotazy…</p>;

  return (
    <div>
      <p className="admin-tabdesc">Dotazy z okna „Zeptejte se nás". Spam je předfiltrovaný; tady je můžete odbavit.</p>
      {msgs.length === 0 ? (
        <p className="member-note">Zatím žádné dotazy.</p>
      ) : (
        <div className="dotazy-list">
          {msgs.map((m) => (
            <div className={`dotaz${m.status === "spam" ? " spam" : ""}${m.status === "read" ? " read" : ""}`} key={m.id}>
              <div className="dotaz-head">
                <b>{m.name || "Anonym"}</b>
                {m.email && <a href={`mailto:${m.email}`}>{m.email}</a>}
                <span className="dotaz-date">{fmt(m.created_at)}</span>
                {m.status !== "new" && <span className="dotaz-tag">{m.status === "read" ? "vyřízeno" : "spam"}</span>}
              </div>
              <p className="dotaz-body">{m.body}</p>
              <div className="dotaz-actions">
                {m.status !== "read" && <button className="btn btn-out" onClick={() => setStatus(m.id, "read")}>Označit vyřízeno</button>}
                {m.status !== "spam" && <button className="ma-link" onClick={() => setStatus(m.id, "spam")}>Spam</button>}
                {m.status !== "new" && <button className="ma-link" onClick={() => setStatus(m.id, "new")}>Vrátit</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
