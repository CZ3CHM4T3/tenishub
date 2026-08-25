"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useMe } from "@/lib/useMe";
import { checkMessage } from "@/lib/moderace";
import { Heart, MessageCircle, Send, EyeOff, Trash2 } from "lucide-react";

type Comment = { id: string; author_id: string; author_name: string | null; body: string; hidden: boolean; created_at: string };
const fmt = (iso: string) => new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });

export function ArticleSocial({ articleId }: { articleId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const { me, isAdmin } = useMe();
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [{ count }, cs] = await Promise.all([
      supabase.from("article_likes").select("*", { count: "exact", head: true }).eq("article_id", articleId),
      supabase.from("article_comments").select("id,author_id,author_name,body,hidden,created_at").eq("article_id", articleId).order("created_at", { ascending: true }),
    ]);
    setLikes(count ?? 0);
    setComments((cs.data as Comment[]) ?? []);
  }, [supabase, articleId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!me) { setLiked(false); return; }
    supabase.from("article_likes").select("article_id").eq("article_id", articleId).eq("profile_id", me.id).maybeSingle().then(({ data }) => setLiked(!!data));
  }, [supabase, articleId, me]);

  const toggleLike = async () => {
    if (!me) { window.location.href = "/prihlaseni?next=" + encodeURIComponent(location.pathname); return; }
    if (liked) { setLiked(false); setLikes((n) => Math.max(0, n - 1)); await supabase.from("article_likes").delete().eq("article_id", articleId).eq("profile_id", me.id); }
    else { setLiked(true); setLikes((n) => n + 1); await supabase.from("article_likes").insert({ article_id: articleId, profile_id: me.id }); }
  };

  const addComment = async () => {
    if (!me) { window.location.href = "/prihlaseni?next=" + encodeURIComponent(location.pathname); return; }
    const mod = checkMessage(body);
    if (!mod.ok) { setErr(mod.reason === "spam" ? "Komentář vypadá jako spam." : mod.reason); return; }
    setBusy(true); setErr("");
    const { error } = await supabase.from("article_comments").insert({ article_id: articleId, author_id: me.id, author_name: me.name, body: body.trim() });
    setBusy(false);
    if (error) { setErr("Nepodařilo se odeslat."); return; }
    setBody(""); load();
  };

  const setHidden = async (id: string, hidden: boolean) => { await supabase.from("article_comments").update({ hidden }).eq("id", id); load(); };
  const del = async (id: string) => { if (!confirm("Smazat komentář?")) return; await supabase.from("article_comments").delete().eq("id", id); load(); };

  const visible = comments.filter((c) => !c.hidden || isAdmin);

  return (
    <div className="asoc">
      <div className="asoc-bar">
        <button className={`asoc-like${liked ? " on" : ""}`} onClick={toggleLike} aria-pressed={liked}>
          <Heart size={18} fill={liked ? "currentColor" : "none"} /> {likes}
        </button>
        <span className="asoc-cc"><MessageCircle size={18} /> {visible.length}</span>
      </div>

      <h3 className="asoc-h">Diskuze</h3>

      {me ? (
        <div className="asoc-form">
          <textarea rows={2} placeholder="Napište komentář…" value={body} onChange={(e) => setBody(e.target.value)} />
          {err && <span className="asoc-err">{err}</span>}
          <button className="btn btn-green asoc-send" disabled={busy || body.trim().length < 2} onClick={addComment}>Přidat <Send size={15} /></button>
        </div>
      ) : (
        <p className="asoc-login"><Link href={"/prihlaseni?next=" + (typeof window !== "undefined" ? encodeURIComponent(location.pathname) : "")}>Přihlaste se</Link>, ať můžete lajkovat a diskutovat.</p>
      )}

      <div className="asoc-list">
        {visible.length === 0 ? (
          <p className="asoc-empty">Zatím bez komentářů. Buďte první!</p>
        ) : visible.map((c) => (
          <div className={`asoc-c${c.hidden ? " hidden" : ""}`} key={c.id}>
            <span className="asoc-av">{(c.author_name || "?").charAt(0).toUpperCase()}</span>
            <div className="asoc-c-in">
              <div className="asoc-c-head"><b>{c.author_name || "Člen"}</b><span>{fmt(c.created_at)}</span>{c.hidden && <em>skryto</em>}</div>
              <p>{c.body}</p>
              {(isAdmin || me?.id === c.author_id) && (
                <div className="asoc-c-act">
                  {isAdmin && <button onClick={() => setHidden(c.id, !c.hidden)}><EyeOff size={13} /> {c.hidden ? "Zobrazit" : "Skrýt"}</button>}
                  <button onClick={() => del(c.id)}><Trash2 size={13} /> Smazat</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
