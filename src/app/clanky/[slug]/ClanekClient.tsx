"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { BookOpen } from "lucide-react";

type Article = { title: string; perex: string | null; body: string; author_name: string | null; created_at: string };
const fmt = (iso: string) => new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });

export default function ClanekClient({ slug }: { slug: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [a, setA] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("articles").select("title,perex,body,author_name,created_at").eq("slug", slug).maybeSingle();
      setA((data as Article) ?? null);
      setLoading(false);
    })();
  }, [supabase, slug]);

  return (
    <div className="acct-page">
      <SiteHeader />

      <div className="wrap acct-wrap" style={{ maxWidth: 760 }}>
        {loading ? <p className="member-note">Načítám…</p> : !a ? (
          <div className="acct-card mc-gate"><BookOpen size={30} /><h2>Článek nenalezen</h2><Link href="/clanky" className="btn btn-green">Zpět do knihovny</Link></div>
        ) : (
          <article className="clanek">
            <h1>{a.title}</h1>
            <p className="clanek-meta">{a.author_name || "TenisHub"} · {fmt(a.created_at)}</p>
            {a.perex && <p className="clanek-lead">{a.perex}</p>}
            {a.body.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
          </article>
        )}
      </div>
    </div>
  );
}
