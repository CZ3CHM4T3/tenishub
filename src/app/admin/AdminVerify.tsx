"use client";

// Admin → Ověření: všichni poskytovatelé se stavem (splněné podmínky / ověřeno),
// filtry a udělení odznaku. Žádná fronta žádostí — admin uděluje ručně.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BadgeCheck, Search, ExternalLink, X } from "lucide-react";

type Spec = { id: string; name: string; kind: string; city: string | null; phone: string | null; website: string | null; photo_url: string | null; verified: boolean; license_declared: boolean | null; owner_id: string | null };

const KIND: Record<string, string> = { coach: "Trenér", physio: "Fyzio", fitness: "Fitness", academy: "Škola", stringer: "Vyplétač" };

export default function AdminVerify() {
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [reviewCount, setReviewCount] = useState<Record<string, number>>({});
  const [payingByCoach, setPayingByCoach] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "verified" | "ready" | "notready">("all");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const sb = createClient();
    const { data: sp } = await sb.from("specialists").select("id,name,kind,city,phone,website,photo_url,verified,license_declared,owner_id").order("verified", { ascending: true }).order("name");
    const list = (sp as Spec[]) ?? [];
    setSpecs(list);
    const ownerOf: Record<string, string | null> = {}; list.forEach((s) => { ownerOf[s.id] = s.owner_id; });
    const { data: rv } = await sb.from("reviews").select("specialist_id,author_id");
    const rc: Record<string, number> = {};
    ((rv as { specialist_id: string; author_id: string | null }[]) ?? []).forEach((r) => {
      if (r.author_id && r.author_id === ownerOf[r.specialist_id]) return; // self-review se nepočítá
      rc[r.specialist_id] = (rc[r.specialist_id] ?? 0) + 1;
    });
    setReviewCount(rc);
    const { data: roster } = await sb.from("coach_roster").select("coach_id,member_id").eq("status", "active");
    const rlist = (roster as { coach_id: string; member_id: string }[]) ?? [];
    const memberIds = [...new Set(rlist.map((r) => r.member_id).filter(Boolean))];
    let activeSet = new Set<string>();
    if (memberIds.length) {
      const { data: mem } = await sb.from("memberships").select("profile_id").in("profile_id", memberIds).eq("status", "active").gt("expires_at", new Date().toISOString());
      activeSet = new Set(((mem as { profile_id: string }[]) ?? []).map((m) => m.profile_id));
    }
    const pbc: Record<string, number> = {};
    rlist.forEach((r) => { if (activeSet.has(r.member_id)) pbc[r.coach_id] = (pbc[r.coach_id] ?? 0) + 1; });
    setPayingByCoach(pbc);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const condOf = useCallback((s: Spec) => {
    const members = s.owner_id ? (payingByCoach[s.owner_id] ?? 0) : 0;
    const checks = [
      !!(s.name && s.name.trim() && s.name !== "Nový trenér"),
      !!s.photo_url, !!(s.city && s.city.trim()), !!(s.phone && s.phone.trim()), !!(s.website && s.website.trim()),
      (reviewCount[s.id] ?? 0) >= 1, members >= 10, !!s.license_declared,
    ];
    const met = checks.filter(Boolean).length;
    return { met, total: checks.length, allMet: met === checks.length, members };
  }, [reviewCount, payingByCoach]);

  const setVerified = async (id: string, v: boolean) => {
    setBusy(id);
    const sb = createClient();
    await sb.from("specialists").update({ verified: v }).eq("id", id);
    await load(); setBusy(null);
  };

  const shown = useMemo(() => specs.filter((s) => {
    if (q && !(`${s.name} ${s.city ?? ""}`.toLowerCase().includes(q.toLowerCase()))) return false;
    const c = condOf(s);
    if (filter === "verified") return s.verified;
    if (filter === "ready") return !s.verified && c.allMet;
    if (filter === "notready") return !s.verified && !c.allMet;
    return true;
  }), [specs, q, filter, condOf]);

  const counts = useMemo(() => {
    let verified = 0, ready = 0, notready = 0;
    specs.forEach((s) => { if (s.verified) verified++; else if (condOf(s).allMet) ready++; else notready++; });
    return { verified, ready, notready, all: specs.length };
  }, [specs, condOf]);

  return (
    <div className="acct-card">
      <div className="acct-card-head"><BadgeCheck size={20} /><h2>Členové a ověření ({specs.length})</h2></div>
      <p className="member-note" style={{ marginTop: "-0.3rem" }}>Ověřeno = známka důvěry, na mapě se ukazují jen ověření. Uděluj jen reálným a aktivně spravovaným.</p>

      <div className="admin-filters">
        {([["all", `Vše (${counts.all})`], ["ready", `Splňuje podmínky (${counts.ready})`], ["notready", `Nesplňuje (${counts.notready})`], ["verified", `Ověřeno (${counts.verified})`]] as const).map(([k, l]) => (
          <button key={k} className={`afbtn${filter === k ? " on" : ""}`} onClick={() => setFilter(k)}>{l}</button>
        ))}
        <span className="afsearch"><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hledat jméno / město" />{q && <button onClick={() => setQ("")}><X size={13} /></button>}</span>
      </div>

      {loading ? <p className="member-note">Načítám…</p> : (
        <div className="admin-scroll">
          <table className="admin-table">
            <thead><tr><th>Poskytovatel</th><th>Typ</th><th>Město</th><th>Podmínky</th><th>Členů</th><th>Stav</th><th>Akce</th></tr></thead>
            <tbody>
              {shown.map((s) => {
                const c = condOf(s);
                return (
                  <tr key={s.id}>
                    <td><b>{s.name || "—"}</b></td>
                    <td>{KIND[s.kind] ?? s.kind}</td>
                    <td>{s.city || "—"}</td>
                    <td><span className={`cond${c.allMet ? " ok" : ""}`}>{c.met}/{c.total}</span></td>
                    <td className={c.members >= 10 ? "" : "nomember"}>{c.members}</td>
                    <td>{s.verified ? <span className="member-badge">OVĚŘENO</span> : c.allMet ? <span className="cond ok">připraven</span> : <span className="nomember">nesplňuje</span>}</td>
                    <td className="admin-actions">
                      <Link href={`/trener/${s.id}`} className="admin-linkbtn" target="_blank"><ExternalLink size={13} /> Profil</Link>
                      {s.verified
                        ? <button className="danger" onClick={() => setVerified(s.id, false)} disabled={busy === s.id}>Zrušit</button>
                        : <button onClick={() => setVerified(s.id, true)} disabled={busy === s.id}><BadgeCheck size={13} /> Ověřit</button>}
                    </td>
                  </tr>
                );
              })}
              {shown.length === 0 && <tr><td colSpan={7} className="member-note">Nikdo neodpovídá filtru.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
