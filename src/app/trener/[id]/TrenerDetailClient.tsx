"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import TrenerProfile, { type Spec } from "../TrenerProfile";

export default function TrenerDetailClient({ id }: { id: string }) {
  const [spec, setSpec] = useState<Spec | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    const supabase = createClient();
    supabase.from("specialists").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) { setSpec(data as Spec); setState("ok"); }
      else setState("missing");
    });
  }, [id]);

  if (state === "loading") return <div className="acct-loading">Načítám profil…</div>;
  if (state === "missing") return (
    <div className="acct-loading" style={{ flexDirection: "column", display: "flex", gap: "1rem" }}>
      <p>Tenhle profil jsme nenašli.</p>
      <Link href="/mapa" className="btn btn-gold">Zpět na mapu</Link>
    </div>
  );
  return <TrenerProfile spec={spec!} />;
}
