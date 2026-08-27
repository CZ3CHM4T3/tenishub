"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import Link from "next/link";
import { IconRun } from "@tabler/icons-react";
import { WhistleIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { CITIES, citySlug } from "@/lib/cities";
import { isHiddenRole } from "@/lib/simplify";
import { AppetizerSlider } from "@/components/AppetizerSlider";
import { AskUs } from "@/components/AskUs";
import { Wordmark } from "@/components/Wordmark";
import { AuthNav } from "@/components/AuthNav";
import { HeroCarousel } from "@/components/HeroCarousel";
import { CenaClenstvi } from "@/components/CenaClenstvi";
import { VideoNudge } from "@/components/VideoNudge";
import {
  Search, CalendarCheck, ArrowRight, ChevronDown, Check, MapPin, Star,
  Users, Trophy, Handshake, Building2, HeartPulse, Award,
  Dumbbell, GraduationCap, Video, MessageCircle, type LucideIcon,
  CalendarDays, Target, BarChart3, History,
} from "lucide-react";

/* ── Persony: srovnání Zdarma vs HUB+ (placené = vše zdarma + navíc) ── */
type IconType = ComponentType<{ size?: number; style?: Record<string, string> }>;
type Persona = {
  key: string; Icon: IconType; label: string; promise: string;
  free: string[]; plus: string[];
};
const PERSONAS: Persona[] = [
  { key: "trener", Icon: WhistleIcon, label: "Trenér", promise: "Víc klientů, míň papírování.",
    free: ["Vizitka v katalogu", "Být k nalezení na mapě", "Veřejné recenze"],
    plus: ["Kalendář a online rezervace", "Platby předem (GoPay)", "Správa klientů a omluvenky", "Ověřený odznak a top pozice", "Články a FAQ návody"] },
  { key: "rodic-hobby", Icon: Users, label: "Rodič hobby hráče", promise: "Najdi, rezervuj, zaplať — a měj klid.",
    free: ["Hledání trenérů a klubů", "Profily a recenze", "Prohlížení sparring nabídek"],
    plus: ["Moje cesta — deník tréninků a volna dítěte", "Rezervace a platby na pár kliků", "Zprávy trenérům", "Přehled dítěte (rozvrh, platby)", "Články a FAQ návody"] },
  { key: "rodic-zavodni", Icon: Trophy, label: "Rodič závodního hráče", promise: "Celá cesta dítěte pod kontrolou.",
    free: ["Hledání špičkových specialistů", "Profily a recenze", "Veřejné žebříčky"],
    plus: ["Moje cesta — kalendář kariéry dítěte", "Profil hráče — výsledky a vývoj", "Plánovač turnajů", "Tréninkový checklist", "Sparring podle výkonnosti"] },
  { key: "hrac-amater", Icon: IconRun, label: "Hráč amatér", promise: "Vždycky s kým a kde hrát.",
    free: ["Mapa kurtů a trenérů", "Prohlížení sparringu", "Veřejné žebříčky"],
    plus: ["Rezervace kurtů a lekcí", "Sparring matchmaking", "Statistiky zápasů", "Ligy a výzvy", "Články a FAQ návody"] },
  { key: "hrac-zavodni", Icon: IconRun, label: "Hráč závodní", promise: "Celý tvůj tenisový tým na jednom místě.",
    free: ["Mapa specialistů", "Veřejné žebříčky", "Prohlížení sparringu"],
    plus: ["Rezervace u trenéra i klubu", "Profil hráče a statistiky", "Plánovač turnajů", "Video-analýza", "Články a FAQ návody"] },
  { key: "sparring", Icon: Handshake, label: "Sparring partner", promise: "Nabídni se a hraj víc.",
    free: ["Prohlížení nabídek na mapě"],
    plus: ["Vlastní sparring inzerát", "Kontaktovat parťáka", "Matchmaking podle úrovně", "Hodnocení po zápase", "Články a FAQ návody"] },
  { key: "areal", Icon: Building2, label: "Klub / areál", promise: "Plné kurty, míň práce.",
    free: ["Profil areálu na mapě", "Kontakty a otevírací doba"],
    plus: ["Rezervační systém + platby", "Obsaď volný kurt teď", "Statistiky vytíženosti", "Napojení trenérů", "Články a FAQ návody"] },
  { key: "fyzio", Icon: HeartPulse, label: "Fyzioterapeut", promise: "Noví klienti z tenisu, co řeší tělo.",
    free: ["Profil fyzia na mapě", "Veřejné recenze"],
    plus: ["Online objednávky termínů", "Poptávky od hráčů (leady)", "Rehabilitační plány online", "Ověřený odznak", "Články a FAQ návody"] },
  { key: "fitness", Icon: Dumbbell, label: "Fitness trenér", promise: "Kondiční klienti přímo z tenisu.",
    free: ["Profil na mapě", "Veřejné recenze"],
    plus: ["Online objednávky tréninků", "Poptávky od hráčů a rodičů", "Prodej kondičních programů", "Ověřený odznak", "Články a FAQ návody"] },
];

// barva role (sladěná s plástí) — pro barevné odlišení v sekci „Pro koho"
const PERSONA_COLOR: Record<string, { c: string; t: string }> = {
  trener: { c: "#7C4DD6", t: "#EEEDFE" },
  "rodic-hobby": { c: "#7c6018", t: "#F2EAD6" },
  "rodic-zavodni": { c: "#7c6018", t: "#F2EAD6" },
  "hrac-amater": { c: "#3b5666", t: "#E5ECF1" },
  "hrac-zavodni": { c: "#3b5666", t: "#E5ECF1" },
  sparring: { c: "#8a5640", t: "#F2E6DF" },
  areal: { c: "#2f5d57", t: "#E0EBE9" },
  fyzio: { c: "#864a59", t: "#F2E5E9" },
  fitness: { c: "#4a5b86", t: "#E8ECF4" },
};

// Zjednodušený web: skryté persony (fitness/fyzio/hráč) — viz lib/simplify.
const VISIBLE_PERSONAS = PERSONAS.filter((p) => !isHiddenRole(p.key.split("-")[0]));

// Obrys ČR pro dekorativní 3D mapu na trenérské dlaždici (z reálných souřadnic).
const CZ_MAP =
  "-70,207 -61,186 -45,192 -27,196 -6,192 19,178 56,165 81,144 117,139 148,122 153,99 161,90 176,93 187,101 " +
  "190,120 213,119 230,98 248,101 260,120 270,135 307,139 336,162 356,156 372,152 381,165 362,196 381,212 " +
  "392,236 408,244 423,226 428,191 453,197 482,215 500,215 512,205 516,225 537,247 548,257 574,266 599,274 " +
  "601,300 628,335 599,366 558,409 551,424 526,432 493,449 456,441 431,480 401,454 340,459 318,441 247,428 " +
  "233,457 208,486 173,485 161,489 133,483 110,456 76,424 42,391 12,364 -14,345 -38,297 -22,271 -29,258 " +
  "-52,249 -59,231";

// Piny služeb ve stylu /mapa (kapka + ikona role); 2 „ověřené" mají zlatý prsten + ✓.
// Poloha v % dlaždice — horní pruh NAD textem a kolem Jirkovy hlavy, ať neleží přes copy.
// ikony rolí (stejné jako /mapa)
const IC_COACH = '<circle cx="12" cy="8" r="3.2"/><path d="M6 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/>';
const IC_CLUB = '<path d="M5 20V9l7-4 7 4v11"/><path d="M5 20h14"/><path d="M10 20v-5h4v5"/>';
const IC_ACADEMY = '<path d="M12 5 3 9l9 4 9-4-9-4z"/><path d="M6.5 11v4c0 1.2 2.6 2.2 5.5 2.2s5.5-1 5.5-2.2v-4"/>';
const IC_PHYSIO = '<path d="M3 12h4l2 5 4-12 2 7h6"/>';
const IC_FITNESS = '<path d="M7 8v8M4.5 10v4M17 8v8M19.5 10v4M7 12h10"/>';
const IC_STRINGER = '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 4v16M15 4v16M4 9h16M4 15h16"/>';
// Piny na souřadnicích MAPY (uvnitř siluety), rozeseté po celé ČR. Jen 2 jsou „ověřené" (zlatý prsten + ✓).
const WT_PINS: { x: number; y: number; c: string; icon: string; verified?: boolean }[] = [
  { x: 40, y: 205, c: "#c8a24c", icon: IC_COACH, verified: true },   // trenér ✓ (západ)
  { x: 165, y: 160, c: "#2e7d4f", icon: IC_CLUB, verified: true },   // klub ✓ (SZ)
  { x: 275, y: 245, c: "#7a5bc0", icon: IC_ACADEMY },                // akademie (střed)
  { x: 415, y: 240, c: "#d9534f", icon: IC_PHYSIO },                 // fyzio (východ-střed)
  { x: 355, y: 395, c: "#2f6fb0", icon: IC_FITNESS },               // fitness (jih)
  { x: 545, y: 265, c: "#5a6470", icon: IC_STRINGER },              // vyplétač (východ)
  { x: 110, y: 265, c: "#2e7d4f", icon: IC_CLUB },                  // + JZ
  { x: 235, y: 345, c: "#c8a24c", icon: IC_COACH },                 // + jih-střed
  { x: 315, y: 180, c: "#2f6fb0", icon: IC_FITNESS },              // + sever-střed
  { x: 450, y: 220, c: "#7a5bc0", icon: IC_ACADEMY },               // + SV
  { x: 490, y: 350, c: "#c8a24c", icon: IC_COACH },                 // + JV
  { x: 565, y: 300, c: "#d9534f", icon: IC_PHYSIO, verified: true }, // + daleký východ ✓
  { x: 200, y: 210, c: "#2f6fb0", icon: IC_FITNESS },              // + SZ-střed
  { x: 330, y: 300, c: "#5a6470", icon: IC_STRINGER },             // + střed-jih
  { x: 430, y: 300, c: "#2e7d4f", icon: IC_CLUB },                 // + JV-střed
  { x: 505, y: 235, c: "#c8a24c", icon: IC_COACH },                // + SV
  { x: 60, y: 300, c: "#2e7d4f", icon: IC_CLUB },                  // JZ
  { x: 105, y: 345, c: "#c8a24c", icon: IC_COACH },               // JZ
  { x: 155, y: 310, c: "#7a5bc0", icon: IC_ACADEMY },             // JZ
  { x: 45, y: 255, c: "#2f6fb0", icon: IC_FITNESS },              // JZ-západ
  { x: 120, y: 385, c: "#5a6470", icon: IC_STRINGER },            // JZ-jih
];
// tvar kapky mapového pinu (špička v počátku, hlava se středem ~ (0,-26))
const PIN_D = "M0,0 C-7,-12 -13,-18 -13,-26 A13,13 0 1,1 13,-26 C13,-18 7,-12 0,0 Z";

const KIND_META: Record<string, { label: string; Icon: LucideIcon }> = {
  coach: { label: "Trenér", Icon: Award },
  physio: { label: "Fyzio", Icon: HeartPulse },
  fitness: { label: "Fitness", Icon: Dumbbell },
  academy: { label: "Akademie", Icon: GraduationCap },
};

// Poctivé hodnotové hlášky (ne smyšlené recenze — ty přidáme, až budou reálné).
const STRIP = [
  "Najdi ověřeného trenéra i klub na mapě",
  "Veď dítě celou sezónou — bez vyhoření",
  "Zeptej se odborníka na cokoli kolem tenisu",
  "Najdi dítěti sparring parťáka na jeho úroveň",
  "Trenér má vlastní klubové rozhraní zdarma",
  "Komunita rodičů, co jsou o krok dál",
  "Turnaje, bazar i spolujízda na jednom místě",
];

function Counter({ to, suffix }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / 1600, 1);
          const ea = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(to * ea).toLocaleString("cs-CZ") + (suffix ?? "");
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, suffix]);
  return <span ref={ref}>0{suffix ?? ""}</span>;
}

export default function Home() {
  const [persona, setPersona] = useState(0);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [progress, setProgress] = useState(0);
  const [featured, setFeatured] = useState<{ id: string; name: string; kind: string; city: string | null; rating: number | null; photo_url: string | null }[]>([]);
  const [specCount, setSpecCount] = useState(0);
  const [venueCount, setVenueCount] = useState(0);
  const [waitCount, setWaitCount] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.body.scrollHeight - innerHeight;
      setProgress(h > 0 ? (scrollY / h) * 100 : 0);
      setSolid(scrollY > 30);
    };
    addEventListener("scroll", onScroll);
    return () => removeEventListener("scroll", onScroll);
  }, []);

  // dropdown menu: zavřít kliknutím mimo
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".nav-item")) setOpenMenu(null);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  // scroll-reveal řeší globální <ScrollReveal /> v layoutu

  // reální specialisté + reálná čísla (žádné vymyšlené staty)
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.from("specialists").select("id,name,kind,city,rating,photo_url").eq("verified", true).order("rating", { ascending: false, nullsFirst: false }).limit(14);
      if (data) setFeatured(data as typeof featured);
      const [{ count: sc }, { count: vc }, { count: wc }] = await Promise.all([
        supabase.from("specialists").select("*", { count: "exact", head: true }),
        supabase.from("venues").select("*", { count: "exact", head: true }),
        supabase.from("waitlist").select("*", { count: "exact", head: true }),
      ]);
      if (sc != null) setSpecCount(sc);
      if (vc != null) setVenueCount(vc);
      if (wc != null) setWaitCount(wc);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const p = VISIBLE_PERSONAS[persona];
  const PIcon = p.Icon;
  const pc = PERSONA_COLOR[p.key];
  const marquee = featured.length ? [...featured, ...featured] : [];
  // pás ověřených lidí s hodnocením (reální; když jich je málo, padne to na hodnotové hlášky)
  const stripPeople = featured.filter((f) => f.rating != null);
  const useRealStrip = stripPeople.length >= 3;
  const stripLoop = [...stripPeople, ...stripPeople];

  return (
    <>
      <div className="progress" style={{ width: `${progress}%` }} />

      {/* HEADER */}
      <header className={`site${solid ? " solid" : ""}`}>
        <div className="wrap">
          <div className="bar">
            <Link href="/" className="brand" aria-label="TenisHub">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-tenishub.png" alt="TenisHub" className="brand-img" />
            </Link>
            <nav className="menu">
              <div className="nav-item">
                <button className={`nav-link${openMenu === "koho" ? " open" : ""}`} type="button" onClick={() => setOpenMenu((m) => (m === "koho" ? null : "koho"))}>Pro koho <ChevronDown size={15} /></button>
                <div className={`drop${openMenu === "koho" ? " open" : ""}`}><div className="drop-inner">
                  <Link className="drop-card" href="/rodic"><b>Rodič &amp; dítě</b><span>najít, sledovat, poradit</span></Link>
                  <Link className="drop-card" href="/pro-trenery"><b>Trenér</b><span>vlastní klub &amp; svěřenci</span></Link>
                  <Link className="drop-card" href="/pro-koho?role=sparring"><b>Sparring partner</b><span>najdi s kým hrát</span></Link>
                </div></div>
              </div>
              <Link className="nav-link" href="/mapa">Mapa služeb</Link>
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
              <Link href="/rodic">Rodič &amp; dítě</Link>
              <Link href="/pro-trenery">Trenér</Link>
              <Link href="/mapa">Mapa služeb</Link>
              <Link href="/clenstvi">Členství</Link>
              <Link href="/o-nas">O nás</Link>
            </nav>
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <span className="orb orb1" /><span className="orb orb2" /><span className="orb orb3" />
        <div className="wrap">
          <div className="hero-center">
            <span className="hero-tagline rv">Jednička pro rodiče malých tenistů a jejich trenéry</span>
            <HeroCarousel />

            {/* PÁS OVĚŘENÝCH LIDÍ — reální ověření specialisté s hodnocením (přes celou šířku) */}
            <div className={`testi-strip rv${useRealStrip ? " testi-strip-people" : ""}`} aria-label="Ověření specialisté na TenisHubu">
              <div className="testi-track">
                {useRealStrip
                  ? stripLoop.map((f, i) => (
                    <Link href={`/trener/${f.id}`} className="tstrip-person" key={i}>
                      <span className="tsp-ava" style={f.photo_url ? { backgroundImage: `url(${f.photo_url})` } : undefined}>
                        {!f.photo_url && (f.name || "?").trim().charAt(0).toUpperCase()}
                      </span>
                      <span className="tsp-txt">
                        <b>{f.name}</b>
                        <span>{(KIND_META[f.kind]?.label ?? "Trenér")}{f.city ? ` · ${f.city}` : ""}</span>
                      </span>
                      <span className="tsp-rate"><Star size={12} /> {Number(f.rating).toFixed(1)}</span>
                      <span className="tsp-verif"><Check size={12} /> Ověřeno</span>
                    </Link>
                  ))
                  : [...STRIP, ...STRIP].map((s, i) => (
                    <span className="tstrip-item" key={i}><Star size={13} /> {s}</span>
                  ))}
              </div>
            </div>

            {/* 2 SVĚTY — hlavní volba experience */}
            <div className="worlds rv d3">
              <Link href="/rodic" className="world world-rodic" style={{ backgroundImage: "url(/svet-rodic.png)" }}>
                <span className="world-in">
                  <span className="world-tag">Rodič &amp; dítě</span>
                  <span className="world-sub">Hledám trenéra, hlídám cestu dítěte a chci poradit</span>
                  <span className="world-go">Vstoupit <ArrowRight size={16} /></span>
                </span>
              </Link>
              <Link href="/pro-trenery" className="world world-sluzby world-trainer">
                <span className="wt-bg" aria-hidden="true" style={{ backgroundImage: "url(/trener-bg.png)" }} />
                <span className="wt-map" aria-hidden="true">
                  <svg viewBox="-95 82 760 430" preserveAspectRatio="xMidYMid meet">
                    <polygon className="wt-map-glass" points={CZ_MAP} />
                    {WT_PINS.map((p, i) => (
                      <g key={i} transform={`translate(${p.x},${p.y})`}>
                        {p.verified && <circle className="wt-pin-ring" cx="0" cy="-26" r="16.5" />}
                        <path className="wt-pin-drop" d={PIN_D} style={{ fill: p.c }} />
                        <g className="wt-pin-ic" transform="translate(-7.5,-33.5) scale(0.625)" dangerouslySetInnerHTML={{ __html: p.icon }} />
                        {p.verified && (
                          <g transform="translate(0,-43)">
                            <circle className="wt-pin-badge" r="7.5" />
                            <path className="wt-pin-tick" d="M-3.2,0.2 L-1,2.6 L3.4,-2.8" />
                          </g>
                        )}
                      </g>
                    ))}
                  </svg>
                </span>
                {/* Jirka — stojící postava před mapou (mírně doleva) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="wt-figure" src="/jirka.png" alt="Jiří Machek — spoluzakladatel akademie MS GEM" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
                {/* text dole vpravo — zrcadlově k „Rodič & dítě" vlevo */}
                {/* kredit o Jirkovi — NALEVO od něj */}
                <span className="wt-cred">
                  <span className="wt-cred-logo" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/msgem-logo.png" alt="MS GEM" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  </span>
                  <span className="wt-cred-txt"><b>Jiří Machek</b><span>spoluzakladatel akademie MS GEM</span></span>
                </span>
                {/* obecné info — NAPRAVO dole (zrcadlově k „Rodič a dítě") */}
                <span className="world-in wt-in">
                  <span className="world-tag">Trenéři a kluby</span>
                  <span className="wt-head">Získejte nefér výhodu proti konkurenci</span>
                  <span className="wt-sub">Profil a rozhraní <b>zdarma</b>. Vlastní klub a strom dovedností po svém.</span>
                  <span className="world-go">Vstoupit <ArrowRight size={16} /></span>
                </span>
              </Link>
            </div>

            {/* JAK VÁM MŮŽEME POMOCI — naváděcí podpora pro rodiče */}
            <div className="help rv d3">
              <h2 className="help-title">Jak vám můžeme pomoci?</h2>
              <div className="help-opts">
                <Link href="/mapa" className="help-opt"><span className="help-ic"><Search size={20} /></span><span>Najít trenéra pro dítě</span><ArrowRight size={16} className="help-arr" /></Link>
                <Link href="/videorozbor" className="help-opt"><span className="help-ic"><Video size={20} /></span><span>Dítě ztrácí radost / něco mu nejde</span><ArrowRight size={16} className="help-arr" /></Link>
                <Link href="/pristup" className="help-opt"><span className="help-ic"><CalendarCheck size={20} /></span><span>Sledovat pokrok a plánovat (Moje cesta)</span><ArrowRight size={16} className="help-arr" /></Link>
                <Link href="/sparring" className="help-opt"><span className="help-ic"><Handshake size={20} /></span><span>Najít sparring partnera</span><ArrowRight size={16} className="help-arr" /></Link>
                <a href="mailto:info@tenishub.cz?subject=Dotaz" className="help-opt"><span className="help-ic"><MessageCircle size={20} /></span><span>Mám dotaz — poradíte mi?</span><ArrowRight size={16} className="help-arr" /></a>
              </div>
            </div>
          </div>
        </div>

        <div className="scrollcue">SCROLL ↓</div>
      </section>

      {/* reálné statistiky — samostatný tenký pruh pod herem, netlačí do layoutu */}
      <section className="statbar">
        <div className="wrap hero-stats">
          <span className="hstat"><b><Counter to={specCount} /></b><i>specialistů</i></span>
          <span className="hstat"><b><Counter to={venueCount} /></b><i>klubů a areálů</i></span>
          <span className="hstat"><b>{CITIES.length}</b><i>měst</i></span>
          <span className="hstat"><b><Counter to={waitCount} /></b><i>zájemců o klub</i></span>
        </div>
      </section>

      {/* MOJE CESTA — hlavní produkt */}
      {/* MOJE CESTA — hlavní bod HUB+ pro rodiče */}
      <section className="mcpromo">
        <div className="wrap mcpromo-in">
          <div className="mcpromo-txt rv l">
            <span className="mcpromo-eyebrow">★ Hlavní výhoda HUB+ pro rodiče</span>
            <h2>Moje cesta — celá tenisová cesta dítěte <span className="g">na jednom místě</span></h2>
            <p>Provede hobby i závodního hráče <b>celou sezónou</b>: osa příprava → sezóna → mezisezóna, barevný kalendář (tréninky, turnaje i s výsledky, kondice), cíle a statistiky — a hlavně <b>volno a čas jen pro sebe</b>. Růst krok za krokem, bez vyhoření.</p>
            <div className="mcpromo-cta">
              <Link href="/moje-cesta" className="btn btn-green">Otevřít Moji cestu</Link>
              <Link href="/pristup" className="btn btn-out">Staň se členem</Link>
            </div>
          </div>
          <div className="mcpromo-vis rv r" aria-hidden="true">
            <div className="mcv-card">
              <div className="mcv-axis">
                <span style={{ background: "#3b8a5a", width: "40%" }}>Příprava</span>
                <span style={{ background: "#bf9a47", width: "38%" }}>Sezóna<i className="mcv-now" /></span>
                <span style={{ background: "#cdd3da", width: "22%" }}>Mezi</span>
              </div>
              <div className="mcv-feats">
                {[
                  { Icon: CalendarDays, t: "Kalendář", s: "tréninky · turnaje · volno", c: "#7C4DD6", b: "#EEEDFE" },
                  { Icon: Target, t: "Cíle sezóny", s: "závazek → splněno", c: "#2f5d57", b: "#E0EBE9" },
                  { Icon: BarChart3, t: "Statistiky", s: "výhry, dotahování", c: "#4a5b86", b: "#E8ECF4" },
                  { Icon: Trophy, t: "Žebříček", s: "aktualizuje se samo", c: "#7c6018", b: "#F2EAD6" },
                  { Icon: CalendarCheck, t: "Termíny", s: "zápasy se vyplní samy", c: "#864a59", b: "#F2E5E9" },
                  { Icon: History, t: "Ohlédnutí", s: "kdy a proč vyhráváš", c: "#8a5640", b: "#F2E6DF" },
                ].map((f, i) => (
                  <div className="mcv-feat" key={i}>
                    <span className="mcv-ic" style={{ background: f.b, color: f.c }}><f.Icon size={18} /></span>
                    <span className="mcv-txt"><b>{f.t}</b><span>{f.s}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* APPETIZER — hlavní prodejní blok (co je v členství) */}
      <AppetizerSlider />



      {/* MARQUEE — specialisté z DB */}
      {false && marquee.length > 0 && (
        <section className="marquee-sec">
          <div className="marquee">
            <div className="marquee-track">
              {marquee.map((s, i) => {
                const m = KIND_META[s.kind] ?? KIND_META.coach;
                const MIcon = m.Icon;
                return (
                  <Link href={`/trener/${s.id}`} className="spec-card" key={i}>
                    <span className="spec-ic"><MIcon size={18} /></span>
                    <div><b>{s.name}</b><span className="spec-meta">{m.label}{s.city ? ` · ${s.city}` : ""}</span></div>
                    <span className="spec-rate"><Star size={13} /> {s.rating ?? "—"}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* PRO KOHO — přesunuto na /clenstvi (na homepage skryto) */}
      {false && (
      <section className="sec who-sec" id="proKoho">
        <div className="wrap">
          <span className="eyebrow rv l">Pro koho</span>
          <h2 className="rv l">Co tím získáš ty?</h2>
          <p className="lead rv l">Vyber, kdo jsi — uvidíš, co ti TenisHub usnadní.</p>

          <div className="persona-tabs rv l d1">
            {VISIBLE_PERSONAS.map((pp, i) => {
              const TIcon = pp.Icon;
              const col = PERSONA_COLOR[pp.key];
              const on = i === persona;
              return (
                <button
                  key={pp.key}
                  className={`ptab${on ? " on" : ""}`}
                  onClick={() => setPersona(i)}
                  type="button"
                  style={on ? { background: col.t, color: col.c, borderColor: col.c } : undefined}
                >
                  <TIcon size={16} style={{ color: col.c }} /> {pp.label}
                </button>
              );
            })}
          </div>

          <div className="persona-panel" key={p.key} style={{ borderTop: `3px solid ${pc.c}` }}>
            <div className="persona-promise"><span className="pp-ic" style={{ background: pc.t, color: pc.c }}><PIcon size={22} /></span> <span style={{ color: pc.c }}>{p.promise}</span></div>

            <table className="plan-table">
              <thead>
                <tr>
                  <th />
                  <th>Zdarma</th>
                  <th><span className="th-plus">HUB+</span></th>
                </tr>
              </thead>
              <tbody>
                {p.free.map((f) => (
                  <tr key={f}>
                    <td>{f}</td>
                    <td className="pt-ok"><Check size={16} strokeWidth={3} /></td>
                    <td className="pt-ok pt-gold"><Check size={16} strokeWidth={3} /></td>
                  </tr>
                ))}
                {p.plus.map((f) => (
                  <tr key={f}>
                    <td>{f}</td>
                    <td className="pt-no">—</td>
                    <td className="pt-ok pt-gold"><Check size={16} strokeWidth={3} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="persona-cta">
              <Link href="/pristup" className="btn btn-out">Staň se členem</Link>
              <Link href="/pristup" className="btn btn-gold">Chci předběžný přístup <ArrowRight className="ic" size={18} /></Link>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* JAK TO FUNGUJE — USPÁNO (najdi–rezervuj–zaplať, oživit později) */}
      {false && (
      <section className="sec" id="how">
        <div className="wrap">
          <span className="eyebrow rv">Jak to funguje</span>
          <h2 className="rv">Trenér vede klub, vy sledujete pokrok</h2>
          <div className="steps">
            <div className="step rv l d1"><div className="ic-b"><Search /></div><div className="num">01</div><h3>Najdi trenéra</h3><p>Vyber trenéra a jeho klub na mapě — nebo tě trenér pozve svým odkazem.</p></div>
            <div className="step rv z d2"><div className="ic-b"><Users /></div><div className="num">02</div><h3>Přidej dítě</h3><p>Připoj se k jeho klubu a přidej svoje dítě. Za pár kliků.</p></div>
            <div className="step rv r d3"><div className="ic-b"><Trophy /></div><div className="num">03</div><h3>Sleduj kariéru</h3><p>Strom dovedností, level a Sparing Cup. Vidíš, jak dítě roste.</p></div>
          </div>
        </div>
      </section>
      )}

      {/* CENA / ČLENSTVÍ — HUB+ vs PRO + BOOST */}
      <CenaClenstvi />

      {/* CTA */}
      <section className="sec cta" id="cta">
        <div className="wrap">
          <span className="eyebrow rv" style={{ justifyContent: "center", display: "flex" }}>Pojďme na to</span>
          <h2 className="rv">Pomozte dítěti začít, růst a vydržet u tenisu</h2>
          <p className="rv d1">Přehled, podpora a kontakty na jednom místě — celý tenisový klub pro vaše dítě za 99 Kč měsíčně.</p>
          <Link href="/pristup" className="btn btn-gold rv d2">Staň se členem <ArrowRight className="ic" size={18} /></Link>
        </div>
      </section>

      <AskUs />

      <footer className="site">
        <div className="wrap">
          <div className="grid">
            <div>
              <Wordmark className="wm-lg" />
              <p style={{ maxWidth: 320, fontSize: ".92rem", marginTop: ".9rem" }}>První český online tenisový klub — rodiče, děti a trenéři pohromadě.</p>
            </div>
            <div><h4>Pro koho</h4><div className="links"><Link href="/pro-koho?role=rodic">Rodič &amp; dítě</Link><Link href="/pro-koho?role=trener">Trenéři</Link><Link href="/pro-koho?role=sparring">Sparring</Link></div></div>
            <div><h4>TenisHub</h4><div className="links"><Link href="/clenstvi">Členství</Link><Link href="/o-nas">O nás</Link><Link href="/mapa">Mapa služeb</Link><Link href="/sparring">Sparring</Link><Link href="/soukromi">Soukromí a profily</Link></div></div>
          </div>
          <div className="foot-cities">
            <h4>Tenis ve městech</h4>
            <div className="foot-city-links">
              {CITIES.map((c) => (
                <Link key={c[0]} href={`/tenis/${citySlug(c[0])}`}>{c[0]}</Link>
              ))}
            </div>
          </div>
          <div className="copy"><span>© 2026 TenisHub.cz</span><span>tenishub.cz</span></div>
        </div>
      </footer>

      <VideoNudge side="left" bottom={18} delay={1200} photo="/videorozbor-1.png"
        title="Nebaví vaše dítě tenis?" sub={"Poradíme proč — videorozbor & konzultace →"} />
      <VideoNudge side="right" bottom={108} delay={3200} photo="/videorozbor-2.png"
        title={"Videorozbor & konzultace"} sub={"Placená služba: rozbor techniky, pohybu i hlavy →"} />
    </>
  );
}
