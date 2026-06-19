"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { AuthNav } from "./AuthNav";

const ROLES: [string, string, string][] = [
  ["rodic", "Rodič & dítě", "najít, sledovat, poradit"],
  ["hrac", "Hráč", "hraj, zlepšuj se, sparring"],
  ["trener", "Trenér", "klienti & nástroje"],
  ["sparring", "Sparring partner", "najdi s kým hrát"],
  ["areal", "Areály & kluby", "obsazenost kurtů"],
  ["fyzio", "Fyzio", "klienti z tenisu"],
  ["fitness", "Fitness", "kondiční příprava"],
  ["vyplet", "Vyplétač", "servis raket"],
];

// Sdílená hlavička s plným menu (krémová, sticky) — na obsahových stránkách,
// ať se z kterékoli stránky dá vrátit/přejít kamkoli přes menu.
export function SiteHeader() {
  const [openMenu, setOpenMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest(".nav-item")) setOpenMenu(false); };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  return (
    <header className="shdr">
      <div className="wrap">
        <div className="bar">
          <Link href="/" className="brand" aria-label="TenisHub">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-gg.png" alt="TenisHub" className="brand-img" />
          </Link>
          <nav className="menu">
            <div className="nav-item">
              <button className={`nav-link${openMenu ? " open" : ""}`} type="button" onClick={() => setOpenMenu((m) => !m)}>Pro koho <ChevronDown size={15} /></button>
              <div className={`drop${openMenu ? " open" : ""}`}><div className="drop-inner">
                {ROLES.map(([k, t, s]) => (
                  <Link key={k} className="drop-card" href={`/pro-koho?role=${k}`}><b>{t}</b><span>{s}</span></Link>
                ))}
              </div></div>
            </div>
            <Link className="nav-link" href="/mapa">Hledej</Link>
            <Link className="nav-link" href="/clenstvi">Členství</Link>
            <Link className="nav-link" href="/o-nas">O nás</Link>
          </nav>
          <div className="nav-r">
            <AuthNav />
            <button className="burger" aria-label="Menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen((o) => !o)}>{mobileOpen ? "✕" : "☰"}</button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="mnav" onClick={() => setMobileOpen(false)}>
            <Link href="/pro-koho">Pro koho</Link>
            <Link href="/mapa">Hledej</Link>
            <Link href="/clenstvi">Členství</Link>
            <Link href="/o-nas">O nás</Link>
            <Link href="/rodic">Rodič &amp; dítě</Link>
            <Link href="/prihlaseni" className="mnav-login">Přihlásit se</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
