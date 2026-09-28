"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { MessagesSquare, Lock, CornerDownRight, ThumbsUp, Reply, X } from "lucide-react";
import { catLabel } from "@/lib/forum";
import { notify } from "@/lib/notify";
import { RoleBadge } from "@/components/RoleBadge";

type Thread = { id: string; author_name: string | null; author_role: string | null; category: string; title: string; body: string; created_at: string };
type Post = { id: string; author_name: string | null; author_role: string | null; body: string; created_at: string; parent_id: string | null };
type Like = { count: number; liked: boolean };

const fmt = (iso: string) => new Date(iso).toLocaleString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function ThreadClient({ id }: { id: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likes, setLikes] = useState<Record<string, Like>>({});
  const [loading, setLoading] = useState(true);
  const [canPost, setCanPost] = useState(false);
  const [me, setMe] = useState<{ id: string; name: string } | null>(null);
  const [reply, setReply] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const loadLikes = useCallback(async (ids: string[], uid?: string) => {
    if (!ids.length) { setLikes({}); return; }
    const { data } = await supabase.from("forum_post_likes").select("post_id,profile_id").in("post_id", ids);
    const map: Record<string, Like> = {};
    ids.forEach((pid) => { map[pid] = { count: 0, liked: false }; });
    ((data as { post_id: string; profile_id: string }[]) ?? []).forEach((l) => {
      const m = map[l.post_id]; if (!m) return;
      m.count++; if (uid && l.profile_id === uid) m.liked = true;
    });
    setLikes(map);
  }, [supabase]);

  const loadPosts = useCallback(async (uid?: string) => {
    const { data } = await supabase.from("forum_posts").select("*").eq("thread_id", id).order("created_at");
    const list = (data as Post[]) ?? [];
    setPosts(list);
    await loadLikes(list.map((p) => p.id), uid);
  }, [supabase, id, loadLikes]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      let uid: string | undefined;
      if (user) {
        uid = user.id;
        const [prof, mem] = await Promise.all([
          supabase.from("profiles").select("full_name,email,is_admin").eq("id", user.id).maybeSingle(),
          supabase.from("memberships").select("id").eq("profile_id", user.id).eq("status", "active").gt("expires_at", new Date().toISOString()).limit(1).maybeSingle(),
        ]);
        setMe({ id: user.id, name: prof.data?.full_name || prof.data?.email || "Člen" });
        setCanPost(!!mem.data || prof.data?.is_admin === true);
      }
      const { data: t } = await supabase.from("forum_threads").select("*").eq("id", id).maybeSingle();
      setThread((t as Thread) ?? null);
      await loadPosts(uid);
      setLoading(false);
    })();
  }, [supabase, id, loadPosts]);

  const send = async () => {
    if (!me || !reply.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.from("forum_posts")
      .insert({ thread_id: id, author_id: me.id, author_name: me.name, body: reply.trim(), parent_id: replyTo?.id ?? null })
      .select("id").single();
    setBusy(false);
    if (error) { alert("Odpověď se nepodařilo přidat: " + error.message); return; }
    if (data) notify("forum_reply", data.id);
    setReply(""); setReplyTo(null);
    await loadPosts(me.id);
  };

  const toggleLike = async (postId: string) => {
    if (!me) return;
    const cur = likes[postId] ?? { count: 0, liked: false };
    // optimistický update
    setLikes((m) => ({ ...m, [postId]: { count: cur.count + (cur.liked ? -1 : 1), liked: !cur.liked } }));
    if (cur.liked) await supabase.from("forum_post_likes").delete().eq("post_id", postId).eq("profile_id", me.id);
    else await supabase.from("forum_post_likes").insert({ post_id: postId, profile_id: me.id });
  };

  const startReply = (p: Post) => { setReplyTo({ id: p.id, name: p.author_name || "Člen" }); document.querySelector(".freply-ta")?.scrollIntoView({ behavior: "smooth", block: "center" }); };

  const PostView = ({ p, nested = false }: { p: Post; nested?: boolean }) => {
    const lk = likes[p.id] ?? { count: 0, liked: false };
    return (
      <div className={`fpost${nested ? " fpost-nested" : ""}`} key={p.id}>
        <div className="fpost-head">
          {nested && <CornerDownRight size={14} />}
          <b>{p.author_name || "Člen"}</b><RoleBadge role={p.author_role} /><span>{fmt(p.created_at)}</span>
        </div>
        <p>{p.body}</p>
        <div className="fpost-acts">
          <button className={`fpost-like${lk.liked ? " on" : ""}`} onClick={() => toggleLike(p.id)} disabled={!me} title={me ? "" : "Přihlaste se"}>
            <ThumbsUp size={14} /> {lk.count > 0 ? lk.count : ""}
          </button>
          {canPost && !nested && <button className="fpost-reply" onClick={() => startReply(p)}><Reply size={14} /> Reagovat</button>}
        </div>
      </div>
    );
  };

  const topPosts = posts.filter((p) => !p.parent_id);
  const childrenOf = (pid: string) => posts.filter((p) => p.parent_id === pid);

  return (
    <div className="acct-page">
      <SiteHeader />
      <div className="wrap acct-wrap">
        {loading ? <p className="member-note">Načítám…</p> : !thread ? (
          <div className="acct-card mc-gate"><MessagesSquare size={30} /><h2>Téma nenalezeno</h2>
            <Link href="/forum" className="btn btn-green">Zpět na fórum</Link></div>
        ) : (<>
          <span className="eyebrow">{catLabel(thread.category)}</span>
          <h1 className="acct-h1" style={{ marginBottom: "0.3rem" }}>{thread.title}</h1>
          <div className="fpost fpost-op">
            <div className="fpost-head"><b>{thread.author_name || "Člen"}</b><RoleBadge role={thread.author_role} /><span>{fmt(thread.created_at)}</span></div>
            <p>{thread.body}</p>
          </div>

          <h2 className="mc-adm-h">{posts.length} {posts.length === 1 ? "odpověď" : posts.length >= 2 && posts.length <= 4 ? "odpovědi" : "odpovědí"}</h2>
          <div className="fposts">
            {topPosts.map((p) => (
              <div key={p.id}>
                <PostView p={p} />
                {childrenOf(p.id).map((c) => <PostView key={c.id} p={c} nested />)}
              </div>
            ))}
            {posts.length === 0 && <p className="member-note">Zatím bez odpovědí — buďte první.</p>}
          </div>

          <div className="acct-card freply">
            {!me ? (
              <p className="member-note">Pro odpověď se <Link href="/prihlaseni?next=/forum" className="linklike">přihlaste</Link>.</p>
            ) : !canPost ? (
              <p className="member-note"><Lock size={14} style={{ verticalAlign: "-2px" }} /> Odpovídat můžou členové <b>HUB+</b>. <Link href="/pristup" className="linklike">Chci HUB+</Link></p>
            ) : (<>
              {replyTo && <div className="freply-ctx">Reagujete na <b>{replyTo.name}</b> <button onClick={() => setReplyTo(null)} aria-label="Zrušit"><X size={13} /></button></div>}
              <textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={replyTo ? `Odpověď pro ${replyTo.name}…` : "Vaše odpověď…"} className="freply-ta" />
              <button className="btn btn-green" disabled={busy} onClick={send}>{replyTo ? "Reagovat" : "Odpovědět"}</button>
            </>)}
          </div>
        </>)}
      </div>
    </div>
  );
}
