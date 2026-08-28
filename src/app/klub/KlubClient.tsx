"use client";

// Trenérské rozhraní — svěřenci + osobní zvací link. Jen pro trenéry (is_coach).
// MODULÁRNÍ: trenér si v Nastavení zapne/vypne moduly → podle toho přibývají/mizí záložky.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Users, Link2, Copy, Check, GitBranch, Trophy, UserPlus, Lock, ChevronDown, ArrowRight, Flame, CalendarDays, Info, SlidersHorizontal, Baby, Megaphone } from "lucide-react";
import StromEditor from "./StromEditor";
import GameLockPreview from "./GameLockPreview";
import KlubOvereni from "./KlubOvereni";
import { Nastenka } from "./Nastenka";
import { Akce } from "./Akce";
import { Skupiny } from "./Skupiny";
import { DEFAULT_KURIKULA, type Kurikula } from "@/lib/kariera";

type Member = { id: string; member_name: string | null; kind: string; status: string; created_at: string };

// Moduly trenérského rozhraní — trenér si vybere, co používá.
const MODULES: { k: string; label: string; Icon: typeof Users; desc: string }[] = [
  { k: "nastenka", label: "Nástěnka", Icon: Megaphone, desc: "Oznámení a novinky celé komunitě rodičů (TRENÉR+)." },
  { k: "kalendar", label: "Akce", Icon: CalendarDays, desc: "Akce a termíny s přihlašováním / RSVP (TRENÉR+)." },
  { k: "komunita", label: "Komunita", Icon: Users, desc: "Pozvánky, žádosti o vstup, svěřenci a kolegové (zdarma)." },
  { k: "deti", label: "Děti", Icon: Baby, desc: "Děti v klubu — odemykání dovedností ve stromě." },
  { k: "strom", label: "Strom dovedností", Icon: GitBranch, desc: "Vaše metoda jako herní strom (Boost — jednorázově)." },
  { k: "cup", label: "Sparing Cup", Icon: Trophy, desc: "Interní soutěž svěřenců (Boost — jednorázově)." },
  { k: "informace", label: "Informace", Icon: Info, desc: "Info pro rodiče a novinky (zdarma)." },
];
const DEFAULT_MODS = MODULES.map((m) => m.k);

const fmt = (iso: string) => new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });

export default function KlubClient() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);
  const [preview, setPreview] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [roster, setRoster] = useState<Member[]>([]);
  const [copied, setCopied] = useState(false);
  const [kurikula, setKurikula] = useState<Kurikula>(DEFAULT_KURIKULA);
  const [showTree, setShowTree] = useState(false);
  const [ktab, setKtab] = useState<string>("nastenka");
  const [kids, setKids] = useState<{ id: string; jmeno: string; prezdivka: string; level: number }[]>([]);
  const [mods, setMods] = useState<Record<string, boolean>>(() => Object.fromEntries(DEFAULT_MODS.map((k) => [k, true])));
  const [savingMods, setSavingMods] = useState(false);
  const [modsSaved, setModsSaved] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/prihlaseni?next=/klub"); return; }
    setUid(user.id);
    const prof = await supabase.from("profiles").select("is_coach,is_admin").eq("id", user.id).maybeSingle();
    const coach = !!prof.data?.is_coach;
    const adminPreview = !coach && !!prof.data?.is_admin;
    if (!coach && !adminPreview) { setIsCoach(false); setLoading(false); return; }
    setIsCoach(true);
    setPreview(adminPreview);
    if (adminPreview) {
      setCode(null); setRoster([]); setKids([]); setKurikula(DEFAULT_KURIKULA); setLoading(false); return;
    }
    const [{ data: c }, { data: r }, { data: ck }, { data: kd2 }] = await Promise.all([
      supabase.rpc("my_coach_code"),
      supabase.from("coach_roster").select("id,member_name,kind,status,created_at").eq("coach_id", user.id).in("status", ["active", "pending"]).order("created_at", { ascending: false }),
      supabase.from("coach_kurikulum").select("data").eq("coach_id", user.id).maybeSingle(),
      supabase.from("deti").select("id,jmeno,prezdivka,level").eq("coach_id", user.id).order("jmeno"),
    ]);
    // Moduly zvlášť — kdyby sloupec ještě neexistoval (SQL neproběhla), zůstanou výchozí.
    const md = await supabase.from("specialists").select("modules").eq("owner_id", user.id).maybeSingle();
    const arr = (md.data as { modules?: string[] | null } | null)?.modules;
    if (Array.isArray(arr)) setMods(Object.fromEntries(MODULES.map((m) => [m.k, arr.includes(m.k)])));
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

  const saveMods = async () => {
    if (preview || !uid) return;
    setSavingMods(true);
    const enabled = MODULES.filter((m) => mods[m.k]).map((m) => m.k);
    await supabase.from("specialists").update({ modules: enabled }).eq("owner_id", uid);
    setSavingMods(false); setModsSaved(true); setTimeout(() => setModsSaved(false), 1800);
  };

  if (loading) return <div className="acct-loading">Načítám…</div>;

  if (!isCoach) return (
    <div className="acct-page">
      <SiteHeader />
      <div className="wrap acct-wrap" style={{ maxWidth: 620 }}>
        <div className="acct-card mc-gate">
          <Lock size={30} />
          <h2>Tohle je prostor pro trenéry</h2>
          <p className="member-note">Trenérské rozhraní je dostupné po pozvání. Máte pozvánku od TenisHubu? Zaregistrujte se přes svůj odkaz. Chcete se stát trenérem na TenisHubu? <Link href="/pro-trenery">Podívejte se, jak to funguje</Link>.</p>
        </div>
      </div>
    </div>
  );

  const parents = roster.filter((m) => m.kind === "parent" && m.status === "active");
  const colleagues = roster.filter((m) => m.kind === "colleague" && m.status === "active");
  const pending = roster.filter((m) => m.status === "pending");
  // Herní vrstva (strom + Sparing Cup) = jednorázový Boost. TRENÉR+ = provozní moduly (Nástěnka, Akce…).
  // Zatím obojí odemčené jen v admin náhledu; po napojení plateb = reálné členství/Boost.
  const canGame = preview;
  const canPlus = preview;
  const PLUS_MODS = new Set(["nastenka", "kalendar"]); // moduly pod TRENÉR+

  // Zamykací karta pro TRENÉR+ modul (prodejní náhled pro trenéra bez TRENÉR+).
  const plusLock = (title: string, desc: string) => (
    <div className="acct-card">
      <div className="acct-card-head"><Lock size={20} /><h2>{title}</h2><span className="member-badge">TRENÉR+</span></div>
      <p className="member-note">{desc}</p>
      <p className="member-note">Součást <b>TRENÉR+</b> (299 Kč/měs) — provoz klubu na jednom místě: rezervace 24/7, platby předem, docházka, oznámení i akce. Zdarma zůstává být vidět na mapě a sbírat svěřence.</p>
      <Link href="/pristup" className="btn btn-gold">Chci TRENÉR+</Link>
    </div>
  );

  const approve = async (id: string) => { await supabase.from("coach_roster").update({ status: "active" }).eq("id", id); load(); };
  const reject = async (id: string) => { await supabase.from("coach_roster").delete().eq("id", id); load(); };

  // aktivní záložky = zapnuté moduly; když je aktuální ktab vypnutý, spadni na první zapnutý (nebo nastavení)
  const enabledMods = MODULES.filter((m) => mods[m.k]);
  const active = ktab === "_nastaveni" ? "_nastaveni"
    : (enabledMods.some((m) => m.k === ktab) ? ktab : (enabledMods[0]?.k ?? "_nastaveni"));

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
          <span className="klub-free">Profil zdarma</span>
        </div>
        <p className="member-note" style={{ marginTop: "-0.4rem" }}>Být vidět na TenisHubu a sbírat svěřence je <b>zdarma</b>. Provozní nástroje (rezervace, platby, docházka, oznámení, akce) jsou v <b>TRENÉR+</b>, herní vrstva (strom, Sparing Cup) v <b>Boostu</b>.</p>

        {/* TRENÉRSKÝ BOOST (rozbalovací — jen nadpis, ať netlačí menu dolů) */}
        <details className="klub-fold">
          <summary><Flame size={16} /> Trenérský Boost <em>vaše nefér výhoda</em></summary>
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
        </details>

        <details className="klub-fold">
          <summary><Check size={16} /> Ověřeno TenisHubem <em>podmínky a stav</em></summary>
          <KlubOvereni />
        </details>

        {/* MODULÁRNÍ MENU */}
        <div className="klub-menu">
          {enabledMods.map((m) => {
            const plusLocked = PLUS_MODS.has(m.k) && !canPlus;
            return (
              <button key={m.k} type="button" className={`klub-mtab${active === m.k ? " on" : ""}`} onClick={() => setKtab(m.k)}>
                <m.Icon size={18} /> {m.label}{plusLocked && <Lock size={12} style={{ opacity: 0.55, marginLeft: 2 }} />}
              </button>
            );
          })}
          <button type="button" className={`klub-mtab klub-mtab-set${active === "_nastaveni" ? " on" : ""}`} onClick={() => setKtab("_nastaveni")}><SlidersHorizontal size={18} /> Nastavení</button>
        </div>

        {/* NASTAVENÍ MODULŮ */}
        {active === "_nastaveni" && (
          <div className="acct-card">
            <div className="acct-card-head"><SlidersHorizontal size={20} /><h2>Nastavení rozhraní</h2></div>
            <p className="member-note">Zapněte si jen to, co používáte. Podle toho se v menu nahoře objeví nebo zmizí záložky. Kdykoli změníte.</p>
            <div className="klub-mods">
              {MODULES.map((m) => (
                <label key={m.k} className={`klub-mod${mods[m.k] ? " on" : ""}`}>
                  <span className="klub-mod-ic"><m.Icon size={18} /></span>
                  <span className="klub-mod-txt"><b>{m.label}</b><span>{m.desc}</span></span>
                  <input type="checkbox" checked={!!mods[m.k]} onChange={(e) => setMods((p) => ({ ...p, [m.k]: e.target.checked }))} />
                  <span className="klub-mod-sw" aria-hidden="true" />
                </label>
              ))}
            </div>
            <button className="btn btn-green" onClick={saveMods} disabled={savingMods || preview} style={{ marginTop: "1rem" }}>
              {modsSaved ? <><Check size={16} /> Uloženo</> : savingMods ? "Ukládám…" : "Uložit nastavení"}
            </button>
            {preview && <span className="member-note" style={{ display: "block", marginTop: ".5rem" }}>V náhledu (admin) se nastavení neukládá.</span>}
          </div>
        )}

        {/* NÁSTĚNKA (TRENÉR+) */}
        {active === "nastenka" && uid && (canPlus
          ? <Nastenka coachId={uid} />
          : plusLock("Nástěnka", "Pošlete oznámení a novinky všem rodičům svěřenců najednou — konec hromadných SMS a skupin na sítích."))}

        {/* AKCE / KALENDÁŘ (TRENÉR+) */}
        {active === "kalendar" && uid && (canPlus
          ? <Akce coachId={uid} />
          : plusLock("Akce", "Vypište tréninky, soustředění i turnaje s přihlašováním (RSVP) — víte, kdo přijde, a rodiče mají termíny na jednom místě."))}

        {/* INFORMACE */}
        {active === "informace" && (
          <div className="acct-card">
            <div className="acct-card-head"><Info size={20} /><h2>Informace</h2></div>
            <p className="member-note">TenisHub je vaše <b>reklama a viditelnost</b> — nepřetahujeme vám byznys, jen vám pomáháme být vidět a vypadat profesionálně. Funkce přidáváme postupně; co byste tu chtěli, napište nám přes „Zeptejte se nás".</p>
          </div>
        )}

        {/* KOMUNITA */}
        {active === "komunita" && (<>
        <div className="acct-card klub-invite">
          <div className="acct-card-head"><Link2 size={20} /><h2>Pozvěte rodiče a kolegy</h2></div>
          <p className="member-note">Pošlete tenhle odkaz rodičům svých svěřenců (a klidně i kolegům trenérům). Zaregistrují se a objeví se ve vašem klubu. Odkaz je jen váš.</p>
          <div className="klub-link">
            <input readOnly value={inviteLink} onFocus={(e) => e.currentTarget.select()} />
            <button className="btn btn-gold" onClick={copy}>{copied ? <><Check size={16} /> Zkopírováno</> : <><Copy size={16} /> Kopírovat</>}</button>
          </div>
          {code && <span className="klub-code">Váš kód: <b>{code}</b></span>}
        </div>

        {pending.length > 0 && (
          <div className="acct-card">
            <div className="acct-card-head"><UserPlus size={20} /><h2>Žádosti o vstup ({pending.length})</h2></div>
            <p className="member-note">Rodiče, kteří se hlásí do vaší komunity. Schvalte ty, které znáte.</p>
            <div className="klub-list">
              {pending.map((m) => (
                <div className="klub-row" key={m.id}>
                  <span className="klub-av">{(m.member_name || "?").charAt(0).toUpperCase()}</span>
                  <div style={{ flex: 1 }}><b>{m.member_name || "Rodič"}</b><span>žádá o vstup · {fmt(m.created_at)}</span></div>
                  <button className="btn btn-green" style={{ padding: ".35rem .7rem", fontSize: ".82rem" }} onClick={() => approve(m.id)}><Check size={14} /> Schválit</button>
                  <button className="ma-link" onClick={() => reject(m.id)}>Odmítnout</button>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {uid && (canPlus ? <Skupiny coachId={uid} /> : plusLock("Skupiny", "Rozdělte svěřence do skupin (přípravka, závodní…) a řešte docházku i oznámení hromadně."))}

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
        </>)}

        {/* DĚTI */}
        {active === "deti" && (
          <div className="acct-card">
            <div className="acct-card-head"><Baby size={20} /><h2>Děti v klubu ({kids.length})</h2></div>
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
        )}

        {/* STROM DOVEDNOSTÍ */}
        {active === "strom" && (canGame ? (<>
          <div className="acct-card">
            <div className="acct-card-head"><GitBranch size={20} /><h2>Strom dovedností — vaše metoda</h2></div>
            <p className="member-note">Postavte si vlastní strom dovedností. Děti odemykají uzly, levelují svého tenistu a vidí pokrok — vy vypadáte jako trenér s vlastní metodou. Máte hotový výchozí strom, klidně ho upravte.</p>
            <button className="btn btn-green" onClick={() => setShowTree((v) => !v)}>
              <ChevronDown size={16} style={{ transform: showTree ? "rotate(180deg)" : "none", transition: "0.2s" }} /> {showTree ? "Skrýt editor stromu" : "Otevřít editor stromu"}
            </button>
          </div>
          {showTree && <StromEditor initial={kurikula} />}
        </>) : <GameLockPreview variant="strom" />)}

        {/* SPARING CUP */}
        {active === "cup" && (
          canGame ? (
            <div className="acct-card klub-soon" style={{ textAlign: "center" }}>
              <span className="klub-soon-tag">Brzy</span>
              <Trophy size={26} />
              <h3>Sparing Cup</h3>
              <p>Vaši svěřenci mezi sebou měří síly v žebříčku/poháru. Motivace, rivalita a radost z hraní — a důvod, proč u vás zůstanou.</p>
            </div>
          ) : <GameLockPreview variant="cup" />
        )}
      </div>
    </div>
  );
}
