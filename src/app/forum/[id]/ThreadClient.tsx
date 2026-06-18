"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";
import { MessagesSquare, Lock, CornerDownRight } from "lucide-react";
import { catLabel } from "@/lib/forum";

type Thread = { id: string; author_name: string | null; category: string; title: string; body: string; created_at: string };
type Post = { id: string; author_name: string | null; body: string; created_at: string };

const fmt = (iso: string) => new Date(iso).toLocaleString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function ThreadClient({ id }: { id: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [canPost, setCanPost] = useState(false);
  const [me, setMe] = useState<{ id: string; name: string } | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const loadPosts = useCallback(async () => {
    const { data } = await supabase.from("forum_posts").select("id,author_name,body,created_at").eq("thread_id", id).order("created_at");
    setPosts((data as Post[]) ?? []);
  }, [supabase, id]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [prof, mem] = await Promise.all([
          supabase.from("profiles").select("full_name,email,is_admin").eq("id", user.id).maybeSingle(),
          supabase.from("memberships").select("id").eq("profile_id", user.id).eq("status", "active").gt("expires_at", new Date().toISOString()).limit(1).maybeSingle(),
        ]);
        setMe({ id: user.id, name: prof.data?.full_name || prof.data?.email || "Člen" });
        setCanPost(!!mem.data || prof.data?.is_admin === true);
      }
      const { data: t } = await supabase.from("forum_threads").select("id,author_name,category,title,body,created_at").eq("id", id).maybeSingle();
      setThread((t as Thread) ?? null);
      await loadPosts();
      setLoading(false);
    })();
  }, [supabase, id, loadPosts]);

  const send = async () => {
    if (!me || !reply.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("forum_posts").insert({ thread_id: id, author_id: me.id, author_name: me.name, body: reply.trim() });
    setBusy(false);
    if (error) { alert("Odpověď se nepodařilo přidat: " + error.message); return; }
    setReply("");
    await loadPosts();
  };

  return (
    <div className="acct-page">
      <header className="subhdr"><div className="wrap"><div className="bar">
        <Link href="/" className="brand"><Wordmark /></Link>
        <Link href="/forum" className="back">← Fórum</Link>
      </div></div></header>

      <div className="wrap acct-wrap">
        {loading ? <p className="member-note">Načítám…</p> : !thread ? (
          <div className="acct-card mc-gate"><MessagesSquare size={30} /><h2>Téma nenalezeno</h2>
            <Link href="/forum" className="btn btn-green">Zpět na fórum</Link></div>
        ) : (<>
          <span className="eyebrow">{catLabel(thread.category)}</span>
          <h1 className="acct-h1" style={{ marginBottom: "0.3rem" }}>{thread.title}</h1>
          <div className="fpost fpost-op">
            <div className="fpost-head"><b>{thread.author_name || "Člen"}</b><span>{fmt(thread.created_at)}</span></div>
            <p>{thread.body}</p>
          </div>

          <h2 className="mc-adm-h">{posts.length} {posts.length === 1 ? "odpověď" : posts.length >= 2 && posts.length <= 4 ? "odpovědi" : "odpovědí"}</h2>
          <div className="fposts">
            {posts.map((p) => (
              <div className="fpost" key={p.id}>
                <div className="fpost-head"><CornerDownRight size={14} /><b>{p.author_name || "Člen"}</b><span>{fmt(p.created_at)}</span></div>
                <p>{p.body}</p>
              </div>
            ))}
            {posts.length === 0 && <p className="member-note">Zatím bez odpovědí — buďte první.</p>}
          </div>

          <div className="acct-card freply">
            {!me ? (
              <p className="member-note">Pro odpověď se <Link href="/prihlaseni?next=/forum" className="linklike">přihlaste</Link>.</p>
            ) : !canPost ? (
              <p className="member-note"><Lock size={14} style={{ verticalAlign: "-2px" }} /> Odpovídat můžou členové <b>HUB+</b>. <Link href="/ucet" className="linklike">Chci HUB+</Link></p>
            ) : (<>
              <textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Vaše odpověď…" className="freply-ta" />
              <button className="btn btn-green" disabled={busy} onClick={send}>Odpovědět</button>
            </>)}
          </div>
        </>)}
      </div>
    </div>
  );
}
