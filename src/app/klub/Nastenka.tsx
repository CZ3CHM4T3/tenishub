"use client";

// Nástěnka trenéra — vysílá oznámení celé své komunitě (rodičům v rosteru).
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Megaphone, Send, Trash2 } from "lucide-react";

type Post = { id: string; title: string | null; body: string; created_at: string };
const fmt = (iso: string) => new Date(iso).toLocaleString("cs-CZ", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });

export function Nastenka({ coachId }: { coachId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("coach_posts").select("id,title,body,created_at").eq("coach_id", coachId).order("created_at", { ascending: false });
    setPosts((data as Post[]) ?? []);
  }, [supabase, coachId]);
  useEffect(() => { load(); }, [load]);

  const post = async () => {
    if (!body.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("coach_posts").insert({ coach_id: coachId, title: title.trim() || null, body: body.trim() });
    setBusy(false);
    if (error) { alert("Nepodařilo se odeslat: " + error.message); return; }
    setTitle(""); setBody(""); load();
  };
  const del = async (id: string) => { if (!confirm("Smazat oznámení?")) return; await supabase.from("coach_posts").delete().eq("id", id); load(); };

  return (
    <div className="acct-card">
      <div className="acct-card-head"><Megaphone size={20} /><h2>Nástěnka</h2></div>
      <p className="member-note" style={{ marginTop: "-0.3rem" }}>Napiš jednou — dorazí všem rodičům ve tvé komunitě. Zrušený trénink, novinka, pochvala.</p>
      <div className="nast-compose">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nadpis (nepovinné)" />
        <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Co chceš rodičům oznámit?" />
        <button className="btn btn-green" onClick={post} disabled={busy || !body.trim()}><Send size={15} /> Odeslat oznámení</button>
      </div>

      {posts.length === 0 ? (
        <p className="member-note" style={{ marginTop: "1rem" }}>Zatím žádné oznámení. Napiš první — rodiče ho uvidí ve svém přehledu.</p>
      ) : (
        <div className="nast-list">
          {posts.map((p) => (
            <div className="nast-post" key={p.id}>
              <div className="nast-post-h">
                {p.title && <b>{p.title}</b>}
                <span className="nast-date">{fmt(p.created_at)}</span>
                <button className="linklike danger" onClick={() => del(p.id)} title="Smazat"><Trash2 size={14} /></button>
              </div>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
