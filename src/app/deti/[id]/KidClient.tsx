"use client";

// Stránka dítěte: Kariéra (strom dovedností). Rodič = pohled; trenér klubu = odemykání uzlů.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { ArrowLeft } from "lucide-react";
import Kariera from "./Kariera";
import ProgressEditor from "./ProgressEditor";
import { DEFAULT_KURIKULA, key as nkey, type Curriculum, type Kurikula, type Track } from "@/lib/kariera";

type Dite = { id: string; rodic_id: string; coach_id: string | null; jmeno: string; datum_narozeni: string | null; program: string; prezdivka: string };

function trackFor(d: Dite): Track {
  if (d.datum_narozeni) {
    const age = (Date.now() - new Date(d.datum_narozeni).getTime()) / (365.25 * 864e5);
    if (age < 8) return "mini";
    if (age < 15) return "junior";
    return "adults";
  }
  return "junior";
}

export default function KidClient({ id }: { id: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [dite, setDite] = useState<Dite | null>(null);
  const [role, setRole] = useState<"rodic" | "coach" | null>(null);
  const [meId, setMeId] = useState<string>("");
  const [cur, setCur] = useState<Curriculum>(DEFAULT_KURIKULA.tracks.junior);
  const [unlocked, setUnlocked] = useState<string[]>([]);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/prihlaseni?next=/deti/" + id); return; }
    setMeId(user.id);
    const { data: d } = await supabase.from("deti").select("id,rodic_id,coach_id,jmeno,datum_narozeni,program,prezdivka").eq("id", id).maybeSingle();
    if (!d) { setLoading(false); return; }
    const dd = d as Dite;
    setDite(dd);
    setRole(dd.coach_id === user.id ? "coach" : dd.rodic_id === user.id ? "rodic" : null);
    const track = trackFor(dd);
    const [{ data: ck }, { data: od }] = await Promise.all([
      dd.coach_id ? supabase.from("coach_kurikulum").select("data").eq("coach_id", dd.coach_id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from("odemceno").select("kapitola,uzel").eq("dite_id", id),
    ]);
    const kd = (ck as { data?: unknown } | null)?.data as Kurikula | undefined;
    const kur = kd && (kd as Kurikula).tracks ? kd : DEFAULT_KURIKULA;
    setCur(kur.tracks[track] ?? kur.tracks.junior);
    setUnlocked(((od as { kapitola: string; uzel: string }[]) ?? []).map((o) => nkey(o.kapitola, o.uzel)));
    setLoading(false);
  }, [supabase, router, id]);
  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="acct-loading">Načítám…</div>;
  if (!dite || !role) return (
    <div className="acct-page"><SiteHeader />
      <div className="wrap acct-wrap" style={{ maxWidth: 620 }}>
        <div className="acct-card mc-gate"><h2>Nedostupné</h2><p className="member-note">Tohle dítě není ve vašem klubu ani vaše.</p></div>
      </div>
    </div>
  );

  return (
    <div className="acct-page">
      <SiteHeader />
      <div className="wrap acct-wrap">
        <button className="linklike" onClick={() => router.back()} style={{ marginBottom: "0.6rem" }}><ArrowLeft size={15} /> Zpět</button>
        <div className="mc-head">
          <h1 className="acct-h1">{dite.jmeno} <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "1rem" }}>· {dite.prezdivka}</span></h1>
        </div>
        {role === "coach" ? (
          <>
            <p className="member-note" style={{ marginTop: "-0.4rem" }}>Odemykejte dítěti dovednosti — klikněte na uzel. Předchůdci se odemknou samy.</p>
            <ProgressEditor childId={dite.id} adminId={meId} initial={unlocked} cur={cur} />
          </>
        ) : (
          <Kariera unlocked={unlocked} cur={cur} />
        )}
      </div>
    </div>
  );
}
