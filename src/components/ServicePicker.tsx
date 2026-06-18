"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { Building2, HeartPulse, Dumbbell, Grid3x3, Handshake, ArrowRight, Search, UserPlus } from "lucide-react";
import { WhistleIcon } from "./icons";

type Icon = ComponentType<{ size?: number }>;
type Cta = { label: string; href: string };
type Pick = { key: string; label: string; tagline: string; color: string; fill: string; Icon: Icon; find: Cta; iam: Cta };

const PICKS: Pick[] = [
  { key: "coach", label: "Trenér", tagline: "tenisový trénink", color: "#7C4DD6", fill: "#EEEDFE", Icon: WhistleIcon,
    find: { label: "Hledám trenéra", href: "/mapa?type=coach" }, iam: { label: "Jsem trenér", href: "/pro-koho?role=trener" } },
  { key: "club", label: "Areály & kluby", tagline: "kurty a haly", color: "#2f5d57", fill: "#E0EBE9", Icon: Building2,
    find: { label: "Hledám kurt", href: "/mapa?type=club" }, iam: { label: "Mám areál / klub", href: "/pro-koho?role=areal" } },
  { key: "sparring", label: "Sparring", tagline: "parťák na zápas", color: "#8a5640", fill: "#F2E6DF", Icon: Handshake,
    find: { label: "Najít parťáka", href: "/sparring" }, iam: { label: "Přidat inzerát", href: "/sparring" } },
  { key: "physio", label: "Fyzio", tagline: "rehabilitace a prevence", color: "#864a59", fill: "#F2E5E9", Icon: HeartPulse,
    find: { label: "Hledám fyzio", href: "/mapa?type=physio" }, iam: { label: "Jsem fyzioterapeut", href: "/pro-koho?role=fyzio" } },
  { key: "fitness", label: "Fitness", tagline: "kondice a síla", color: "#4a5b86", fill: "#E8ECF4", Icon: Dumbbell,
    find: { label: "Hledám kondičního", href: "/mapa?type=fitness" }, iam: { label: "Jsem kondiční trenér", href: "/pro-koho?role=fitness" } },
  { key: "stringer", label: "Vyplétač", tagline: "servis raket", color: "#5a6470", fill: "#E6E9ED", Icon: Grid3x3,
    find: { label: "Hledám vyplétače", href: "/mapa?type=stringer" }, iam: { label: "Vyplétám rakety", href: "/pro-koho?role=vyplet" } },
];

export function ServicePicker() {
  const [sel, setSel] = useState<string | null>(null);

  return (
    <div className={`spick${sel ? " has-sel" : ""}`}>
      {PICKS.map((p) => {
        const on = sel === p.key;
        const PIcon = p.Icon;
        return (
          <div
            key={p.key}
            className={`spick-card${on ? " on" : ""}`}
            style={on ? { borderColor: p.color, boxShadow: `0 18px 40px -16px ${p.color}88` } : undefined}
            onClick={() => setSel(on ? null : p.key)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(on ? null : p.key); } }}
          >
            <span className="spick-ic" style={{ background: p.fill, color: p.color }}><PIcon size={30} /></span>
            <span className="spick-txt">
              <b>{p.label}</b>
              <span>{p.tagline}</span>
            </span>
            <span className="spick-chev" style={on ? { color: p.color } : undefined}><ArrowRight size={18} /></span>

            <div className="spick-cta" onClick={(e) => e.stopPropagation()}>
              <Link href={p.find.href} className="spick-btn find" style={{ background: p.color }}>
                <Search size={15} /> {p.find.label}
              </Link>
              <Link href={p.iam.href} className="spick-btn iam" style={{ color: p.color, borderColor: p.color }}>
                <UserPlus size={15} /> {p.iam.label}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
