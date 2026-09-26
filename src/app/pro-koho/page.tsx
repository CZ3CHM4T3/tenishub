import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { RolePage } from "@/components/RolePage";
import { WhistleIcon } from "@/components/icons";
import { IconRun } from "@tabler/icons-react";
import { Users, Handshake, Building2, HeartPulse, Dumbbell, Grid3x3, ArrowRight, type LucideIcon } from "lucide-react";
import { ROLES, ROLE_ORDER, type Role } from "@/lib/roles";
import { isHiddenRole } from "@/lib/simplify";

const VISIBLE_ROLE_ORDER = ROLE_ORDER.filter((k) => !isHiddenRole(k));

export const metadata: Metadata = {
  title: "Pro koho je TenisHub — rodiče, hráči, trenéři, kluby",
  description: "Vyberte svou roli a uvidíte přesně, co pro vás TenisHub dělá a co získáte s členstvím.",
};

const ICONS: Record<Role["icon"], LucideIcon | typeof WhistleIcon | typeof IconRun> = {
  trener: WhistleIcon, rodic: Users, hrac: IconRun, sparring: Handshake,
  areal: Building2, fyzio: HeartPulse, fitness: Dumbbell, vyplet: Grid3x3,
};

export default async function ProKohoPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  if (role === "rodic") redirect("/rodic"); // rodič má vlastní hub
  if (role === "trener") redirect("/pro-trenery"); // trenér má vlastní vstup
  if (role && isHiddenRole(role)) redirect("/"); // zjednodušený web — skryté role
  const r = role ? ROLES[role] : null;

  // Detail role = jednotná stránka ve stylu /rodic
  if (r) return <RolePage role={r} />;

  // Rozcestník rolí
  return (
    <div className="sluzby-page">
      <SiteHeader />
      <div className="wrap sluzby-wrap">
        <span className="eyebrow rv">Pro koho je TenisHub</span>
        <h1 className="rv d1">Vyberte, kdo jste</h1>
        <p className="lead rv d1">Klikněte na svou roli — uvidíte přesně, co pro vás v klubu děláme.</p>
        <div className="rolepick-grid">
          {VISIBLE_ROLE_ORDER.map((k) => {
            const x = ROLES[k]; const Icn = ICONS[x.icon];
            return (
              <Link key={k} href={k === "trener" ? "/pro-trenery" : k === "rodic" ? "/rodic" : `/pro-koho?role=${k}`} className={`rolepick rv z d${Math.min((ROLE_ORDER.indexOf(k) % 4) + 1, 4)}`} style={{ backgroundColor: x.fill, backgroundImage: `url(${x.photo})` }}>
                <span className="rolepick-ic" style={{ color: x.color }}><Icn size={22} /></span>
                <span className="rolepick-txt"><b>{x.label}</b><span>{x.tagline}</span></span>
                <span className="rolepick-arr"><ArrowRight size={18} /></span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
