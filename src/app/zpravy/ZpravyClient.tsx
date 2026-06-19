"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";
import { Send } from "lucide-react";
import { notify } from "@/lib/notify";

type Msg = {
  id: string; from_id: string; to_id: string; from_name: string | null; to_name: string | null;
  specialist_id: string | null; venue_id: string | null; body: string; read_at: string | null; created_at: string;
};
type Conv = { other: string; name: string; last: Msg; unread: number; msgs: Msg[] };

const fmtT = (iso: string) => new Date(iso).toLocaleString("cs-CZ", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });

export default function ZpravyClient() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [myName, setMyName] = useState("");
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  const build = useCallback((msgs: Msg[], me: string): Conv[] => {
    const map = new Map<string, Conv>();
    for (const m of msgs) {
      const other = m.from_id === me ? m.to_id : m.from_id;
      const name = (m.from_id === me ? m.to_name : m.from_name) || "Uživatel";
      let c = map.get(other);
      if (!c) { c = { other, name, last: m, unread: 0, msgs: [] }; map.set(other, c); }
      c.msgs.push(m);
      c.last = m;
      if (m.to_id === me && !m.read_at) c.unread++;
      if (name && name !== "Uživatel") c.name = name;
    }
    return [...map.values()].sort((a, b) => +new Date(b.last.created_at) - +new Date(a.last.created_at));
  }, []);

  const load = useCallback(async () => {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { router.replace("/prihlaseni"); return; }
    setUid(user.id);
    const [{ data: p }, { data: msgs }] = await Promise.all([
      sb.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      sb.from("messages").select("*").or(`from_id.eq.${user.id},to_id.eq.${user.id}`).order("created_at", { ascending: true }),
    ]);
    setMyName(p?.full_name ?? "");
    setConvs(build((msgs as Msg[]) ?? [], user.id));
    setLoading(false);
  }, [router, build]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(load, 15000); // jednoduchý "realtime"
    return () => clearInterval(t);
  }, [load]);
  useEffect(() => { endRef.current?.scrollIntoView(); }, [active, convs]);

  const openConv = async (other: string) => {
    setActive(other);
    if (!uid) return;
    const sb = createClient();
    await sb.from("messages").update({ read_at: new Date().toISOString() })
      .eq("to_id", uid).eq("from_id", other).is("read_at", null);
    load();
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !active || !text.trim()) return;
    const conv = convs.find((c) => c.other === active);
    const sb = createClient();
    const body = text.trim();
    setText("");
    const { data: ins } = await sb.from("messages").insert({
      from_id: uid, to_id: active, from_name: myName || "Hráč", to_name: conv?.name ?? null, body,
    }).select("id").single();
    if (ins) notify("message", ins.id);
    load();
  };

  if (loading) return <div className="acct-loading">Načítám zprávy…</div>;
  const conv = convs.find((c) => c.other === active) ?? null;

  return (
    <div className="acct-page">
      <header className="subhdr"><div className="wrap"><div className="bar">
        <Link href="/" className="brand"><Wordmark /></Link>
        <Link href="/ucet" className="back">← Můj účet</Link>
      </div></div></header>

      <div className="wrap acct-wrap">
        <h1 className="acct-h1">Zprávy</h1>
        {convs.length === 0 ? (
          <div className="acct-card"><p className="member-note">Zatím žádné zprávy. Napiš trenérovi z jeho profilu — ozve se ti tady.</p></div>
        ) : (
          <div className="chat">
            <div className="chat-list">
              {convs.map((c) => (
                <button key={c.other} className={`chat-conv${active === c.other ? " on" : ""}`} onClick={() => openConv(c.other)}>
                  <div className="chat-conv-top"><b>{c.name}</b>{c.unread > 0 && <span className="chat-badge">{c.unread}</span>}</div>
                  <div className="chat-conv-last">{c.last.body}</div>
                </button>
              ))}
            </div>
            <div className="chat-thread">
              {!conv ? (
                <div className="chat-empty">Vyber konverzaci vlevo.</div>
              ) : (
                <>
                  <div className="chat-thread-head">{conv.name}</div>
                  <div className="chat-msgs">
                    {conv.msgs.map((m) => (
                      <div key={m.id} className={`chat-msg${m.from_id === uid ? " me" : ""}`}>
                        <div className="chat-bubble">{m.body}</div>
                        <div className="chat-time">{fmtT(m.created_at)}</div>
                      </div>
                    ))}
                    <div ref={endRef} />
                  </div>
                  <form className="chat-input" onSubmit={send}>
                    <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Napiš zprávu…" />
                    <button className="btn btn-gold" type="submit" aria-label="Odeslat"><Send size={16} /></button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
