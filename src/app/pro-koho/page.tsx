import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/Wordmark";
import { WhistleIcon } from "@/components/icons";
import { IconRun } from "@tabler/icons-react";
import { Users, Handshake, Building2, HeartPulse, Dumbbell, Grid3x3, Check, Lock, ArrowRight, Search, type LucideIcon } from "lucide-react";
import { ROLES, ROLE_ORDER, type Role } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Pro koho je TenisHub — rodiče, hráči, trenéři, kluby",
  description: "Vyberte svou roli a uvidíte přesně, co pro vás TenisHub dělá — co je zdarma a co navíc s HUB+.",
};

const ICONS: Record<Role["icon"], LucideIcon | typeof WhistleIcon | typeof IconRun> = {
  trener: WhistleIcon, rodic: Users, hrac: IconRun, sparring: Handshake,
  areal: Building2, fyzio: HeartPulse, fitness: Dumbbell, vyplet: Grid3x3,
};

export default async function ProKohoPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  if (role === "rodic") redirect("/rodic"); // rodič má vlastní hub
  const r = role ? ROLES[role] : null;

  return (
    <div className="sluzby-page">
      <header className="subhdr"><div className="wrap"><div className="bar">
        <Link href="/" className="brand"><Wordmark /></Link>
        <Link href="/" className="back">← Zpět na web</Link>
      </div></div></header>

      <div className="wrap sluzby-wrap">
        {r ? <RoleDetail r={r} /> : (<>
          <span className="eyebrow">Pro koho je TenisHub</span>
          <h1>Vyberte, kdo jste</h1>
          <p className="lead">Klikněte na svou roli — uvidíte rovnou všechno, co pro vás děláme, a co je zdarma vs s HUB+.</p>
          <div className="prole-grid">
            {ROLE_ORDER.map((k) => {
              const x = ROLES[k]; const I = ICONS[x.icon];
              return (
                <Link key={k} href={`/pro-koho?role=${k}`} className="prole-card">
                  <span className="prole-ic" style={{ background: x.fill, color: x.color }}><I size={26} /></span>
                  <span className="prole-txt"><b>{x.label}</b><span>{x.tagline}</span></span>
                  <span className="prole-arr"><ArrowRight size={18} /></span>
                </Link>
              );
            })}
          </div>
        </>)}
      </div>
    </div>
  );
}

function RoleDetail({ r }: { r: Role }) {
  const I = ICONS[r.icon];
  return (
    <>
      <Link href="/pro-koho" className="role-back">← Všechny role</Link>
      <div className="role-hero">
        <span className="role-hero-ic" style={{ background: r.fill, color: r.color }}><I size={40} /></span>
        <div>
          <h1 style={{ margin: 0 }}>{r.label}</h1>
          <p className="lead" style={{ margin: "0.2rem 0 0" }}>{r.tagline}</p>
        </div>
      </div>

      <div className="rodic-plan-cols" style={{ marginTop: "1.4rem" }}>
        <div className="rp-col">
          <div className="rp-col-head"><h3>Zdarma</h3><span className="rp-tag rp-tag-free">navždy</span></div>
          <ul className="rp-list">
            {r.free.map((f, i) => <li key={i}><Check size={16} /> {f.label}{f.soon && <em className="soon"> brzy</em>}</li>)}
          </ul>
          <Link href={r.find.href} className="btn btn-green" style={{ width: "100%" }}><Search size={16} /> {r.find.label}</Link>
        </div>
        <div className="rp-col rp-col-hub">
          <div className="rp-col-head"><h3>HUB+</h3><span className="rp-tag rp-tag-hub">200 Kč/měs</span></div>
          <ul className="rp-list rp-list-locked">
            {r.plus.map((f, i) => <li key={i}><Lock size={15} /> {f.label}{f.soon && <em className="soon"> brzy</em>}</li>)}
          </ul>
          <Link href="/ucet" className="btn btn-gold" style={{ width: "100%" }}>Chci HUB+</Link>
        </div>
      </div>

      <div className="role-cta">
        <Link href="/prihlaseni?tab=reg" className="btn btn-out">Vytvořit účet zdarma</Link>
        {r.provider && <span className="role-note">Jste {r.label.toLowerCase()}? Vytvořte si profil, ať vás lidé najdou.</span>}
      </div>

      <div className="role-others">
        <span>Jiná role:</span>
        {ROLE_ORDER.filter((k) => k !== r.key).map((k) => (
          <Link key={k} href={`/pro-koho?role=${k}`} className="role-chip">{ROLES[k].label}</Link>
        ))}
      </div>
    </>
  );
}
