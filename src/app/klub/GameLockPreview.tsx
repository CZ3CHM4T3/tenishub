"use client";

// Lákavý ZAMČENÝ náhled placené herní vrstvy (TRENÉR+): strom dovedností + Sparing Cup.
// Ukáže ochutnávku (rozmazaná mock grafika) + zámek s odznakem TRENÉR+ a CTA.
import Link from "next/link";
import { Lock, Check, GitBranch, Trophy } from "lucide-react";

const TREE_NODES = [
  { x: 50, y: 20, on: true }, { x: 22, y: 46, on: true }, { x: 78, y: 46, on: true },
  { x: 12, y: 76, on: false }, { x: 36, y: 76, on: false }, { x: 64, y: 76, on: false }, { x: 88, y: 76, on: false },
];
const TREE_LINKS = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];

function TreeMock() {
  return (
    <svg className="glp-art" viewBox="0 0 100 96" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {TREE_LINKS.map(([a, b], i) => (
        <line key={i} x1={TREE_NODES[a].x} y1={TREE_NODES[a].y} x2={TREE_NODES[b].x} y2={TREE_NODES[b].y} stroke="#c7a355" strokeWidth="1.4" opacity="0.6" />
      ))}
      {TREE_NODES.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r="7.5" fill={n.on ? "#bf9a47" : "#e7ddc9"} stroke="#fff" strokeWidth="1.6" />
          {n.on && <circle cx={n.x} cy={n.y} r="2.4" fill="#fff" />}
        </g>
      ))}
    </svg>
  );
}

function CupMock() {
  return (
    <svg className="glp-art" viewBox="0 0 100 96" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {[[18, 60, 22], [50, 40, 42], [82, 68, 14]].map(([x, y, h], i) => (
        <rect key={i} x={(x as number) - 11} y={y as number} width="22" height={h as number} rx="3" fill={i === 1 ? "#bf9a47" : "#d9ccae"} />
      ))}
      <path d="M42 22h16v5a8 8 0 0 1-16 0z" fill="#bf9a47" /><rect x="47" y="30" width="6" height="7" fill="#bf9a47" /><rect x="42" y="36" width="16" height="4" rx="2" fill="#bf9a47" />
    </svg>
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
