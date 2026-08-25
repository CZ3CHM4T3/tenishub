"use client";

// Trenérské rozhraní — svěřenci + osobní zvací link. Jen pro trenéry (is_coach).
// Fáze 1: roster + pozvánky. Fáze 2 (brzy): tech tree (skill tree) + Sparring Cup.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Users, Link2, Copy, Check, GitBranch, Trophy, UserPlus, Lock, ChevronDown, ArrowRight, Flame } from "lucide-react";
import StromEditor from "./StromEditor";
import KlubOvereni from "./KlubOvereni";
import { DEFAULT_KURIKULA, type Kurikula } from "@/lib/kariera";

type Member = { id: string; member_name: string | null; kind: string; status: string; created_at: string };

const fmt = (iso: string) => new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });

export default function KlubClient() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);
  const [preview, setPreview] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [roster, setRoster] = useState<Member[]>([]);
  const [copied, setCopied] = useState(false);
  const [kurikula, setKurikula] = useState<Kurikula>(DEFAULT_KURIKULA);
  const [showTree, setShowTree] = useState(false);
  const [kids, setKids] = useState<{ id: string; jmeno: string; prezdivka: string; level: number }[]>([]);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/prihlaseni?next=/klub"); return; }
    const prof = await supabase.from("profiles").select("is_coach,is_admin").eq("id", user.id).maybeSingle();
    const coach = !!prof.data?.is_coach;
    const adminPreview = !coach && !!prof.data?.is_admin;
    if (!coach && !adminPreview) { setIsCoach(false); setLoading(false); return; }
    setIsCoach(true);
    setPreview(adminPreview);
    if (adminPreview) {
      // Admin náhled: prázdná data + výchozí strom, ať vidí, jak rozhraní vypadá.
      setCode(null); setRoster([]); setKids([]); setKurikula(DEFAULT_KURIKULA); setLoading(false); return;
    }
    const [{ data: c }, { data: r }, { data: ck }, { data: kd2 }] = await Promise.all([
      supabase.rpc("my_coach_code"),
      supabase.from("coach_roster").select("id,member_name,kind,status,created_at").eq("coach_id", user.id).eq("status", "active").order("created_at", { ascending: false }),
      supabase.from("coach_kurikulum").select("data").eq("coach_id", user.id).maybeSingle(),
      supabase.from("deti").select("id,jmeno,prezdivka,level").eq("coach_id", user.id).order("jmeno"),
    ]);
    setCode(typeof c === "string" ? c : null);
    setRoster((r as Member[]) ?? []);
    setKids((kd2 as { id: string; jmeno: string; prezdivka: string; level: number }[]) ?? []);
    const kd = (ck as { data?: unknown } | null)?.data as Kurikula | undefined;
    setKurikula(kd && (kd as Kurikula).tracks ? kd : DEFAULT_KURIKULA);
    setLoading(false);
  }, [supabase, router]);
  useEffect(() => { load(); }, [load]);

  const inviteLink = code ? `${typeof window !== "undefined" ? window.location.origin : ""}/prihlaseni?tab=reg&invite=${code}` : "";
  const copy = async () => { try { await navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* */ } };

  if (loading) return <div className="acct-loading">Načítám…</div>;

  if (!isCoach) return (
    <div className="acct-page">
      <SiteHeader />
      <div className="wrap acct-wrap" style={{ maxWidth: 620 }}>
        <div className="acct-card mc-gate">
          <Lock size={30} />
          <h2>Tohle je prostor pro trenéry</h2>
          <p className="member-note">Trenérské rozhraní je dostupné po pozvání. Máte pozvánku od TenisHubu? Zaregistrujte se přes svůj odkaz. Chcete se stát trenérem na TenisHubu? Napište nám na <a href="mailto:info@tenishub.cz">info@tenishub.cz</a>.</p>
        </div>
      </div>
    </div>
  );

  const parents = roster.filter((m) => m.kind === "parent");
  const colleagues = roster.filter((m) => m.kind === "colleague");

  return (
    <div className="acct-page">
      <SiteHeader />
      <div className="wrap acct-wrap">
        {preview && (
          <div className="admin-preview-bar">
            👁️ Náhledový režim (admin) — takhle vidí rozhraní trenér. Data jsou prázdná / ukázková.
          </div>
        )}
        <div className="mc-head">
          <h1 className="acct-h1"><Users size={26} style={{ verticalAlign: "-4px" }} /> Můj klub</h1>
          <span className="klub-free">Zdarma · žádné členství</span>
        </div>
        <p className="member-note" style={{ marginTop: "-0.4rem" }}>Vaše trenérské rozhraní a profil na TenisHubu jsou <b>zdarma</b> — členství neplatíte. Zvěte rodiče a spravujte svěřence.</p>

        {/* TRENÉRSKÝ BOOST */}
        <div className="acct-card boost-card">
          <div className="boost-head">
            <span className="boost-flame"><Flame size={26} /></span>
            <div><span className="boost-eyebrow">Vaše nefér výhoda</span><h2>Trenérský Boost</h2></div>
          </div>
          <p className="member-note">Profil a rozhraní máte zdarma. <b>Boost</b> je jednorázový balíček, kterým dáte dětem něco, co u tenisu ještě neměly — a sobě náskok před konkurencí:</p>
          <ul className="boost-list">
            <li><b>Customizovatelný strom dovedností</b> — vaše vlastní metoda. Děti odemykají uzly a levelují svou postavu.</li>
            <li><b>Interní soutěž (Sparing Cup)</b> — děti mezi sebou měří síly. Rodiče si ji z velké části organizují sami, vy jen dohlížíte, řešíte ceny a vyhlašování.</li>
            <li><b>Zábava, motivace a engagement</b>, jaké u tenisu ještě nezažily — a důvod, proč u vás zůstanou.</li>
          </ul>
          <div className="boost-why">
            <span className="boost-why-h">Co vám to přinese</span>
            <span className="boost-why-t">Děti se těší na trénink a u tenisu zůstávají (míň odchodů = stabilní příjem), rodiče vidí pokrok a doporučují vás dál, a vy vypadáte jako trenér s vlastní promyšlenou metodou. Jednorázová investice, náskok napořád.</span>
          </div>
          <div className="boost-cta">
            <span className="boost-price">Jednorázově od <b>5 000 Kč</b><span>Zaplatíte jednou a máte napořád · cena brzy poroste</span></span>
            <Link href="/#zeptejte-se" className="btn btn-gold">Chci Boost</Link>
          </div>
        </div>

        <KlubOvereni />

        {/* POZVÁNKA */}
        <div className="acct-card klub-invite">
          <div className="acct-card-head"><Link2 size={20} /><h2>Pozvěte rodiče a kolegy</h2></div>
          <p className="member-note">Pošlete tenhle odkaz rodičům svých svěřenců (a klidně i kolegům trenérům). Zaregistrují se a objeví se ve vašem klubu. Odkaz je jen váš.</p>
          <div className="klub-link">
            <input readOnly value={inviteLink} onFocus={(e) => e.currentTarget.select()} />
            <button className="btn btn-gold" onClick={copy}>{copied ? <><Check size={16} /> Zkopírováno</> : <><Copy size={16} /> Kopírovat</>}</button>
          </div>
          {code && <span className="klub-code">Váš kód: <b>{code}</b></span>}
        </div>

        {/* SVĚŘENCI */}
        <div className="acct-card">
          <div className="acct-card-head"><UserPlus size={20} /><h2>Moji svěřenci ({parents.length})</h2></div>
          {parents.length === 0 ? (
            <p className="member-note">Zatím nikdo. Pošlete odkaz výše rodičům — jakmile se zaregistrují, objeví se tady.</p>
          ) : (
            <div className="klub-list">
              {parents.map((m) => (
                <div className="klub-row" key={m.id}>
                  <span className="klub-av">{(m.member_name || "?").charAt(0).toUpperCase()}</span>
                  <div><b>{m.member_name || "Rodič"}</b><span>přidal(a) se {fmt(m.created_at)}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DĚTI V KLUBU — trenér je rozklikne a odemyká dovednosti */}
        <div className="acct-card">
          <div className="acct-card-head"><Users size={20} /><h2>Děti v klubu ({kids.length})</h2></div>
          {kids.length === 0 ? (
            <p className="member-note">Zatím žádné děti. Jakmile rodič ve svém účtu přidá dítě, objeví se tady — a vy mu můžete odemykat dovednosti ve stromě.</p>
          ) : (
            <div className="klub-list">
              {kids.map((k) => (
                <Link href={`/deti/${k.id}`} className="klub-row" key={k.id} style={{ textDecoration: "none" }}>
                  <span className="klub-av">{k.jmeno.charAt(0).toUpperCase()}</span>
                  <div style={{ flex: 1 }}><b>{k.jmeno}</b><span>{k.prezdivka} · level {k.level}</span></div>
                  <span className="dite-cta">Odemykat <ArrowRight size={15} /></span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {colleagues.length > 0 && (
          <div className="acct-card">
            <div className="acct-card-head"><Users size={20} /><h2>Kolegové trenéři ({colleagues.length})</h2></div>
            <div className="klub-list">
              {colleagues.map((m) => (
                <div className="klub-row" key={m.id}>
                  <span className="klub-av">{(m.member_name || "?").charAt(0).toUpperCase()}</span>
                  <div><b>{m.member_name || "Trenér"}</b><span>přidal(a) se {fmt(m.created_at)}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STROM DOVEDNOSTÍ (tech tree) */}
        <div className="acct-card">
          <div className="acct-card-head"><GitBranch size={20} /><h2>Strom dovedností — vaše metoda</h2></div>
          <p className="member-note">Postavte si vlastní strom dovedností. Děti odemykají uzly, levelují svého tenistu a vidí pokrok — vy vypadáte jako trenér s vlastní metodou. Máte hotový výchozí strom, klidně ho upravte.</p>
          <button className="btn btn-green" onClick={() => setShowTree((v) => !v)}>
            <ChevronDown size={16} style={{ transform: showTree ? "rotate(180deg)" : "none", transition: "0.2s" }} /> {showTree ? "Skrýt editor stromu" : "Otevřít editor stromu"}
          </button>
        </div>
        {showTree && <StromEditor initial={kurikula} />}

        {/* SPARING CUP — brzy */}
        <div className="acct-card klub-soon" style={{ textAlign: "center" }}>
          <span className="klub-soon-tag">Brzy</span>
          <Trophy size={26} />
          <h3>Sparing Cup</h3>
          <p>Vaši svěřenci mezi sebou měří síly v žebříčku/poháru. Motivace, rivalita a radost z hraní — a důvod, proč u vás zůstanou.</p>
        </div>
      </div>
    </div>
  );
}
