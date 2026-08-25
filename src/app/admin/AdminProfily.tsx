"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BadgeCheck, Check, Award, Users } from "lucide-react";

type Trainer = { id: string; owner_id: string | null; name: string | null; city: string | null; kind: string | null; verified: boolean; verify_requested: boolean | null };
type Prof = { id: string; full_name: string | null; email: string | null; is_admin: boolean };

export default function AdminProfily() {
  const supabase = useMemo(() => createClient(), []);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [parents, setParents] = useState<Prof[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data: sp }, { data: pr }] = await Promise.all([
      supabase.from("specialists").select("id,owner_id,name,city,kind,verified,verify_requested").not("owner_id", "is", null).order("verify_requested", { ascending: false }),
      supabase.from("profiles").select("id,full_name,email,is_admin").order("created_at", { ascending: false }),
    ]);
    const tr = (sp as Trainer[]) ?? [];
    setTrainers(tr);
    const ownerIds = new Set(tr.map((t) => t.owner_id));
    setParents(((pr as Prof[]) ?? []).filter((p) => !ownerIds.has(p.id) && !p.is_admin));
    setLoading(false);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  const setVerified = async (id: string, v: boolean) => {
    setBusy(id);
    await supabase.from("specialists").update({ verified: v, verify_requested: false }).eq("id", id);
    await load(); setBusy(null);
  };

  if (loading) return <p className="admin-tabdesc">Načítám profily…</p>;

  const waiting = trainers.filter((t) => t.verify_requested && !t.verified);
  const verified = trainers.filter((t) => t.verified);
  const rest = trainers.filter((t) => !t.verified && !t.verify_requested);

  const TrainerRow = ({ t }: { t: Trainer }) => (
    <div className="pf-row">
      <span className="pf-av"><Award size={16} /></span>
      <div className="pf-tx"><b>{t.name || "Trenér"}</b><span>{t.city || "—"}{t.verified ? " · ověřeno ✓" : t.verify_requested ? " · žádost čeká" : " · neúplný profil"}</span></div>
      {t.verified
        ? <button className="ma-link" disabled={busy === t.id} onClick={() => setVerified(t.id, false)}>Zrušit ověření</button>
        : <button className="btn btn-green" disabled={busy === t.id} onClick={() => setVerified(t.id, true)}><Check size={14} /> Ověřit</button>}
    </div>
  );

  return (
    <div>
      <p className="admin-tabdesc">Profily podle kategorií. Ověřujeme ručně — ověřený profil je vidět na mapě a má odemčené funkce.</p>

      <h3 className="pf-h"><BadgeCheck size={17} /> Trenéři — žádosti o ověření ({waiting.length})</h3>
      {waiting.length === 0 ? <p className="member-note">Žádné čekající žádosti.</p> : <div className="pf-list">{waiting.map((t) => <TrainerRow key={t.id} t={t} />)}</div>}

      <h3 className="pf-h" style={{ marginTop: "1.4rem" }}><Award size={17} /> Ověření trenéři ({verified.length})</h3>
      {verified.length === 0 ? <p className="member-note">Zatím žádný.</p> : <div className="pf-list">{verified.map((t) => <TrainerRow key={t.id} t={t} />)}</div>}

      {rest.length > 0 && (<>
        <h3 className="pf-h" style={{ marginTop: "1.4rem" }}><Award size={17} /> Trenéři s neúplným profilem ({rest.length})</h3>
        <div className="pf-list">{rest.map((t) => <TrainerRow key={t.id} t={t} />)}</div>
      </>)}

      <h3 className="pf-h" style={{ marginTop: "1.4rem" }}><Users size={17} /> Rodiče ({parents.length})</h3>
      {parents.length === 0 ? <p className="member-note">Zatím žádní.</p> : (
        <div className="pf-list">
          {parents.slice(0, 200).map((p) => (
            <div className="pf-row" key={p.id}>
              <span className="pf-av">{(p.full_name || p.email || "?").charAt(0).toUpperCase()}</span>
              <div className="pf-tx"><b>{p.full_name || "Rodič"}</b><span>{p.email || "—"}</span></div>
            </div>
          ))}
        </div>
      )}

      <h3 className="pf-h" style={{ marginTop: "1.4rem" }}><Users size={17} /> Hráči (sparring)</h3>
      <p className="member-note">Kategorie hráčů (ověření přes ČTS) přidáváme — zatím prázdné.</p>
    </div>
  );
}
