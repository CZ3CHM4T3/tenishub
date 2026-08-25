"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { BookOpen, Lock } from "lucide-react";
import { useMe } from "@/lib/useMe";

type Article = { title: string; perex: string | null; body: string; author_name: string | null; created_at: string; is_sample: boolean };
const fmt = (iso: string) => new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });

export default function ClanekClient({ slug }: { slug: string }) {
  const supabase = useMemo(() => createClient(), []);
  const { canPost, ready } = useMe();
  const [a, setA] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("articles").select("title,perex,body,author_name,created_at,is_sample").eq("slug", slug).maybeSingle();
      setA((data as Article) ?? null);
      setLoading(false);
    })();
  }, [supabase, slug]);

  const locked = !!a && !a.is_sample && ready && !canPost;
  const paras = a ? a.body.split(/\n{2,}/) : [];
  const shown = locked ? paras.slice(0, 1) : paras; // nečlen: první odstavec jako ochutnávka

  return (
    <div className="acct-page">
      <SiteHeader />

      <div className="wrap acct-wrap" style={{ maxWidth: 760 }}>
        {loading ? <p className="member-note">Načítám…</p> : !a ? (
          <div className="acct-card mc-gate"><BookOpen size={30} /><h2>Článek nenalezen</h2><Link href="/clanky" className="btn btn-green">Zpět na Vědět víc</Link></div>
        ) : (
          <article className="clanek">
            {a.is_sample && <span className="clanek-sample">Ukázka zdarma</span>}
            <h1>{a.title}</h1>
            <p className="clanek-meta">{a.author_name || "TenisHub"} · {fmt(a.created_at)}</p>
            {a.perex && <p className="clanek-lead">{a.perex}</p>}
            <div className={locked ? "clanek-body-locked" : ""}>
              {shown.map((p, i) => <p key={i}>{p}</p>)}
            </div>
            {locked && (
              <div className="clanek-gate">
                <span className="clanek-gate-ic"><Lock size={26} /></span>
                <h3>Zbytek článku je pro členy</h3>
                <p>Celou knihovnu rad a návodů pro tenisové rodiče i trenéry čtete s členstvím HUBmember — od 99 Kč měsíčně.</p>
                <div className="clanek-gate-btns">
                  <Link href="/prihlaseni?tab=reg" className="btn btn-gold">Staň se členem</Link>
                  <Link href="/clanky" className="btn btn-out">Zpět na ukázky</Link>
                </div>
              </div>
            )}
          </article>
        )}
      </div>
    </div>
  );
}
