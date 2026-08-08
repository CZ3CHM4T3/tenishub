"use client";

// Rodičovská stránka: moje děti v klubu trenéra + přidání dítěte. Vede na /deti/[id] (Kariéra).
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Baby, Plus, X, ArrowRight, Trophy } from "lucide-react";

type Dite = { id: string; jmeno: string; prezdivka: string; level: number; program: string; coach_id: string | null };

export default function DetiClient() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<string>("");
  const [coachId, setCoachId] = useState<string | null>(null);
  const [deti, setDeti] = useState<Dite[]>([]);
  const [form, setForm] = useState({ open: false, jmeno: "", datum: "", program: "hobby" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/prihlaseni?next=/deti"); return; }
    setMe(user.id);
    const [{ data: d }, { data: cr }] = await Promise.all([
      supabase.from("deti").select("id,jmeno,prezdivka,level,program,coach_id").eq("rodic_id", user.id).order("vytvoreno", { ascending: true }),
      supabase.from("coach_roster").select("coach_id").eq("member_id", user.id).eq("status", "active").limit(1).maybeSingle(),
    ]);
    setDeti((d as Dite[]) ?? []);
    setCoachId((cr as { coach_id: string } | null)?.coach_id ?? null);
    setLoading(false);
  }, [supabase, router]);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.jmeno.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("deti").insert({
      rodic_id: me, coach_id: coachId, jmeno: form.jmeno.trim(),
      datum_narozeni: form.datum || null, program: form.program,
    });
    setBusy(false);
    if (error) { alert("Nepodařilo se přidat: " + error.message); return; }
    setForm({ open: false, jmeno: "", datum: "", program: "hobby" });
    await load();
  };

  if (loading) return <div className="acct-loading">Načítám…</div>;

  return (
    <div className="acct-page">
      <SiteHeader />
      <div className="wrap acct-wrap" style={{ maxWidth: 720 }}>
        <div className="mc-head">
          <h1 className="acct-h1"><Baby size={26} style={{ verticalAlign: "-4px" }} /> Moje děti</h1>
          <button className="btn btn-green" onClick={() => setForm((f) => ({ ...f, open: true }))}><Plus size={16} /> Přidat dítě</button>
        </div>
        <p className="member-note" style={{ marginTop: "-0.4rem" }}>
          {coachId ? "Přidejte dítě a sledujte jeho kariéru — strom dovedností, level a Sparing Cup u vašeho trenéra." : "Zatím nejste u žádného trenéra. Přidejte dítě přes zvací odkaz od svého trenéra, ať se propojí s jeho klubem."}
        </p>

        {deti.length === 0 ? (
          <div className="acct-card mc-gate"><Baby size={30} /><h2>Zatím žádné dítě</h2><p>Přidejte první — uvidíte jeho kariéru a pokrok.</p></div>
        ) : (
          <div className="klub-list">
            {deti.map((d) => (
              <Link href={`/deti/${d.id}`} className="klub-row" key={d.id} style={{ textDecoration: "none" }}>
                <span className="klub-av">{d.jmeno.charAt(0).toUpperCase()}</span>
                <div style={{ flex: 1 }}><b>{d.jmeno}</b><span>{d.prezdivka} · level {d.level} · {d.program === "pro" ? "závodní" : "hobby"}</span></div>
                <span className="dite-cta">Kariéra <ArrowRight size={15} /></span>
              </Link>
            ))}
          </div>
        )}

        <div className="acct-card klub-soon" style={{ textAlign: "center", marginTop: "1.4rem" }}>
          <span className="klub-soon-tag">Brzy</span>
          <Trophy size={24} />
          <h3>Sparing Cup</h3>
          <p>Žebříček a pohár, kde vaše dítě měří síly s ostatními ve svém klubu — přidáváme.</p>
        </div>
      </div>

      {form.open && (
        <div className="mc-modal" onClick={() => setForm((f) => ({ ...f, open: false }))}>
          <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
            <button className="mc-x" onClick={() => setForm((f) => ({ ...f, open: false }))}><X size={18} /></button>
            <h3>Přidat dítě</h3>
            <label>Jméno dítěte<input value={form.jmeno} onChange={(e) => setForm({ ...form, jmeno: e.target.value })} placeholder="Např. Ella" /></label>
            <div className="mc-row2">
              <label>Datum narození<input type="date" value={form.datum} onChange={(e) => setForm({ ...form, datum: e.target.value })} /></label>
              <label>Program<select value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })}><option value="hobby">Hobby</option><option value="pro">Závodní</option></select></label>
            </div>
            <button className="btn btn-green" disabled={busy || !form.jmeno.trim()} onClick={submit}>Přidat</button>
          </div>
        </div>
      )}
    </div>
  );
}
