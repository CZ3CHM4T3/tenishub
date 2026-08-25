"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BadgeCheck, Check, X } from "lucide-react";

type Spec = { id: string; name: string | null; city: string | null; phone: string | null; website: string | null; photo_url: string | null; verified: boolean; verify_requested: boolean | null; license_declared: boolean | null };

export default function KlubOvereni() {
  const supabase = useMemo(() => createClient(), []);
  const [spec, setSpec] = useState<Spec | null>(null);
  const [reviews, setReviews] = useState(0);
  const [payingMembers, setPayingMembers] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: s } = await supabase.from("specialists").select("id,name,city,phone,website,photo_url,verified,verify_requested,license_declared").eq("owner_id", user.id).limit(1).maybeSingle();
    const sp = (s as Spec) ?? null;
    setSpec(sp);
    if (sp) {
      const { count } = await supabase.from("reviews").select("id", { count: "exact", head: true }).eq("specialist_id", sp.id).neq("author_id", user.id);
      setReviews(count ?? 0);
    }
    // ≥10 platících členů v komunitě: členové rosteru s aktivním členstvím
    const { data: roster } = await supabase.from("coach_roster").select("member_id").eq("coach_id", user.id).eq("status", "active");
    const ids = ((roster as { member_id: string }[]) ?? []).map((r) => r.member_id).filter(Boolean);
    if (ids.length) {
      const { count } = await supabase.from("memberships").select("id", { count: "exact", head: true }).in("profile_id", ids).eq("status", "active").gt("expires_at", new Date().toISOString());
      setPayingMembers(count ?? 0);
    }
    setLoading(false);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  const items = spec ? [
    { k: "name", label: "Jméno trenéra", ok: !!(spec.name && spec.name.trim() && spec.name !== "Nový trenér") },
    { k: "photo", label: "Profilová fotka s obličejem", ok: !!spec.photo_url },
    { k: "city", label: "Adresa / místo, kde trénujete", ok: !!(spec.city && spec.city.trim()) },
    { k: "phone", label: "Telefonní číslo", ok: !!(spec.phone && spec.phone.trim()) },
    { k: "web", label: "Webová stránka (osobní nebo klubová)", ok: !!(spec.website && spec.website.trim()) },
    { k: "review", label: "Alespoň 1 hodnocení od někoho jiného", ok: reviews >= 1 },
    { k: "members", label: `Alespoň 10 platících členů v komunitě (${payingMembers}/10)`, ok: payingMembers >= 10 },
    { k: "license", label: "Čestné prohlášení o pravosti licence a údajů", ok: !!spec.license_declared, declare: true },
  ] : [];
  const doneCount = items.filter((i) => i.ok).length;
  const allDone = spec && doneCount === items.length;

  const requestVerify = async () => {
    if (!spec) return;
    setSpec({ ...spec, verify_requested: true });
    await supabase.from("specialists").update({ verify_requested: true }).eq("id", spec.id);
  };

  const toggleLicense = async () => {
    if (!spec) return;
    const v = !spec.license_declared;
    setSpec({ ...spec, license_declared: v });
    await supabase.from("specialists").update({ license_declared: v }).eq("id", spec.id);
  };

  if (loading) return null;
  if (!spec) return (
    <div className="acct-card ov-card">
      <div className="acct-card-head"><BadgeCheck size={20} /><h2>Ověřeno TenisHubem</h2></div>
      <p className="member-note">Nejdřív si založte svou trenérskou kartu v účtu — pak se tu odškrtávají podmínky ověření samy.</p>
      <Link href="/ucet" className="btn btn-green">Vytvořit profil trenéra</Link>
    </div>
  );

  return (
    <div className={`acct-card ov-card${spec.verified ? " ov-done" : ""}`}>
      <div className="acct-card-head">
        <BadgeCheck size={20} />
        <h2>Ověřeno TenisHubem</h2>
        {spec.verified && <span className="ov-badge"><Check size={14} /> Máte odznak</span>}
      </div>
      <p className="member-note">
        {spec.verified
          ? "Máte ověřený odznak ✓ všude na webu. Ověřeno se nekupuje — je za reálnou kvalitou."
          : spec.verify_requested
            ? `Žádost o ověření odeslána — TenisHub ji zkontroluje a odznak ✓ vám udělí. Splněno ${doneCount}/${items.length}.`
            : `Splněno ${doneCount} z ${items.length}. Jakmile máte vše, požádejte o ověření — my ho ručně potvrdíme a odemknou se vám funkce.`}
      </p>
      <ul className="ov-list">
        {items.map((it) => (
          <li key={it.k} className={it.ok ? "ok" : ""}>
            <span className="ov-tick">{it.ok ? <Check size={15} /> : <X size={15} />}</span>
            <span className="ov-lab">{it.label}</span>
            {it.declare && !it.ok && (
              <button className="ov-declare" onClick={toggleLicense}>Prohlašuji</button>
            )}
          </li>
        ))}
      </ul>
      {!spec.verified && (
        <div className="ov-cta">
          {allDone && !spec.verify_requested && <button className="btn btn-green" onClick={requestVerify}>Požádat o ověření</button>}
          {spec.verify_requested && !allDone && <span className="ov-wait">Doplňte i zbývající podmínky.</span>}
          <Link href="/ucet" className="btn btn-out">Doplnit profil</Link>
        </div>
      )}
    </div>
  );
}
