"use client";

// Lákavý ZAMČENÝ náhled placené herní vrstvy (TRENÉR+): strom dovedností + Sparing Cup.
// Ukáže ochutnávku (rozmazaná mock grafika) + zámek s odznakem TRENÉR+ a CTA.
import Link from "next/link";
import { Lock, Check, GitBranch, Trophy, Star, Zap, Award, Crown, Medal, Target } from "lucide-react";

// mock „screenshotu" stromu dovedností — vypadá jako reálný budoucí screen
function TreeMock() {
  const nodes = [
    { Icon: Star, on: true }, { Icon: Zap, on: true }, { Icon: Award, on: true },
    { Icon: Target, on: false }, { Icon: GitBranch, on: false }, { Icon: Star, on: false }, { Icon: Zap, on: false }, { Icon: Award, on: false },
  ];
  return (
    <div className="glp-shot" aria-hidden="true">
      <div className="glp-shot-head"><span className="glp-shot-title"><GitBranch size={13} /> Strom dovedností</span><span className="glp-shot-lvl">Level 7</span></div>
      <div className="glp-xp"><span style={{ width: "64%" }} /></div>
      <div className="glp-nodes">
        {nodes.map((n, i) => {
          const N = n.Icon;
          return <span key={i} className={`glp-node${n.on ? " on" : ""}`}>{n.on ? <Check size={15} /> : <N size={14} />}</span>;
        })}
      </div>
      <div className="glp-tags"><span>Bekhend ✓</span><span>Podání ✓</span><span>Voleje</span><span>Smeč</span></div>
    </div>
  );
}

// mock „screenshotu" Sparing Cupu — mini žebříček s body
function CupMock() {
  const rows = [
    { r: 1, n: "Klárka N.", p: 240, Icon: Crown, c: "#bf9a47" },
    { r: 2, n: "Tomík V.", p: 212, Icon: Medal, c: "#9aa3ad" },
    { r: 3, n: "Ela K.", p: 188, Icon: Medal, c: "#b5763f" },
    { r: 4, n: "Matýsek", p: 154 },
  ];
  return (
    <div className="glp-shot" aria-hidden="true">
      <div className="glp-shot-head"><span className="glp-shot-title"><Trophy size={13} /> Sparing Cup</span><span className="glp-shot-lvl">jarní kolo</span></div>
      <div className="glp-lb">
        {rows.map((row) => (
          <div className="glp-lb-row" key={row.r}>
            <span className="glp-lb-rank">{row.Icon ? <row.Icon size={15} style={{ color: row.c }} /> : row.r}</span>
            <span className="glp-lb-name">{row.n}</span>
            <span className="glp-lb-pts">{row.p} b</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GameLockPreview({ variant, audience = "trener" }: { variant: "strom" | "cup"; audience?: "trener" | "rodic" }) {
  const isTree = variant === "strom";
  const isParent = audience === "rodic";
  return (
    <div className="acct-card glp">
      <div className="acct-card-head">
        {isTree ? <GitBranch size={20} /> : <Trophy size={20} />}
        <h2>{isTree ? "Strom dovedností" : "Sparing Cup"}</h2>
        <span className="glp-badge"><Lock size={12} /> {isParent ? "HUB+ · trenér BOOST" : "TRENÉR+"}</span>
      </div>
      <div className="glp-stage">
        {isTree ? <TreeMock /> : <CupMock />}
        <div className="glp-veil"><span className="glp-lock"><Lock size={26} /></span></div>
      </div>
      <p className="member-note glp-lead">
        {isTree
          ? <>Vaše vlastní metoda jako <b>herní strom</b>. Děti odemykají uzly, levelují svou postavu a vidí pokrok — vy vypadáte jako trenér s vlastní metodou.</>
          : <>Interní soutěž svěřenců — <b>žebříček a pohár</b>. Rivalita, motivace a radost z hraní; rodiče si ji z velké části organizují sami.</>}
      </p>
      <ul className="glp-list">
        {(isTree
          ? ["Vlastní uzly a úrovně", "Děti vidí svůj postup a odznaky", "Rodiče sledují pokrok v Moje cesta"]
          : ["Automatický žebříček svěřenců", "Zápasy a výsledky mezi dětmi", "Ceny a vyhlašování"]
        ).map((t) => <li key={t}><Check size={14} /> {t}</li>)}
      </ul>
      <div className="glp-cta">
        {isParent ? (
          <span className="glp-note" style={{ maxWidth: "34ch" }}>Rozsvítí se, až <b>tvůj trenér pořídí BOOST</b> a ty budeš mít HUB+. Dej mu vědět, že bys to chtěl — děti to milují.</span>
        ) : (<>
          <Link href="/#zeptejte-se" className="btn btn-gold"><Lock size={15} /> Odemknout v TRENÉR+</Link>
          <span className="glp-note">Součást balíčku Boost — jednorázově.</span>
        </>)}
      </div>
    </div>
  );
}
