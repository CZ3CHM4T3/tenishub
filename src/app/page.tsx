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
import { useMe } from "@/lib/useMe";
import { VideoNudge } from "@/components/VideoNudge";
import {
  Search, CalendarCheck, ArrowRight, ChevronDown, Check, MapPin, Star,
  Users, Trophy, Handshake, Building2, HeartPulse, Award,
  Dumbbell, GraduationCap, Video, MessageCircle, type LucideIcon,
  CalendarDays, Target, BarChart3, History,
} from "lucide-react";


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
// tvar mapového pinu jako na /mapa (kulatá hlava + rovný krk ke špičce), střed hlavy ~ (0,-21.6)
const PIN_D = "M0,0 L-8,-12 A12.5,12.5 0 1 1 8,-12 Z";

const KIND_META: Record<string, { label: string; Icon: LucideIcon }> = {
  coach: { label: "Trenér", Icon: Award },
  physio: { label: "Fyzio", Icon: HeartPulse },
  fitness: { label: "Fitness", Icon: Dumbbell },
  academy: { label: "Akademie", Icon: GraduationCap },
};

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
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [progress, setProgress] = useState(0);
  const [featured, setFeatured] = useState<{ id: string; name: string; kind: string; city: string | null; rating: number | null; photo_url: string | null }[]>([]);
  const [stripData, setStripData] = useState<{ id: string; name: string; kind: string; city: string | null; rating: number | null; photo_url: string | null; rvText: string | null; rvAuthor: string | null }[]>([]);
  const [rodice, setRodice] = useState(0);
  const [deti, setDeti] = useState(0);
  const [profici, setProfici] = useState(0);
  const { canPost: isMemberHome } = useMe(); // člen HUB+/admin → neukazovat „Chci HUB+"

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
      // pás: ověřené profily, které mají recenzi (klik → profil)
      const ids = (data ?? []).map((d: { id: string }) => d.id);
      if (ids.length) {
        const { data: rv } = await supabase.from("reviews").select("specialist_id,author_name,rating,body").in("specialist_id", ids).not("body", "is", null).order("created_at", { ascending: false });
        const byId: Record<string, { author_name: string | null; body: string }> = {};
        ((rv as { specialist_id: string; author_name: string | null; body: string }[]) ?? []).forEach((r) => { if (r.body && !byId[r.specialist_id]) byId[r.specialist_id] = { author_name: r.author_name, body: r.body }; });
        const sd = (data as typeof featured).map((d) => ({ ...d, rvText: byId[d.id]?.body ?? null, rvAuthor: byId[d.id]?.author_name ?? null }));
        setStripData(sd);
      }
      // reálná čísla (RPC public_stats obejde RLS); fallback: aspoň počet profíků
      const { data: stats, error: statsErr } = await supabase.rpc("public_stats");
      if (!statsErr && stats) {
        setRodice((stats as { rodice?: number }).rodice ?? 0);
        setDeti((stats as { deti?: number }).deti ?? 0);
        setProfici((stats as { profici?: number }).profici ?? 0);
      } else {
        const { count } = await supabase.from("specialists").select("*", { count: "exact", head: true });
        setProfici(count ?? 0);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // pás ověřených profilů s recenzemi (jen reální; když nejsou, pás se skryje)
  const stripSource = stripData;
  const useRealStrip = stripSource.length >= 1;
  const reps = Math.max(2, Math.ceil(8 / Math.max(1, stripSource.length)));
  const stripLoop = Array.from({ length: reps }, () => stripSource).flat();

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
            <HeroCarousel />

            {/* PÁS OVĚŘENÝCH PROFILŮ S RECENZEMI — klik = profil (psát/rezervovat) */}
            {useRealStrip && (
            <div className="testi-strip testi-strip-people rv" aria-label="Ověřené profily s recenzemi">
              <div className="testi-track">
                {stripLoop.map((f, i) => (
                  <Link href={`/trener/${f.id}`} className="tstrip-person" key={i}>
                    <span className="tsp-ava" style={f.photo_url ? { backgroundImage: `url(${f.photo_url})` } : undefined}>
                      {!f.photo_url && (f.name || "?").trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="tsp-txt">
                      <b>{f.name} <span className="tsp-verif"><Check size={11} /> Ověřeno</span></b>
                      {f.rvText
                        ? <span className="tsp-rv">„{f.rvText}"{f.rvAuthor ? <em> — {f.rvAuthor}</em> : null}</span>
                        : <span className="tsp-rv">{(KIND_META[f.kind]?.label ?? "Trenér")}{f.city ? ` · ${f.city}` : ""}</span>}
                    </span>
                    {f.rating != null && <span className="tsp-rate"><Star size={12} /> {Number(f.rating).toFixed(1)}</span>}
                  </Link>
                ))}
              </div>
            </div>
            )}

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
                        <g className="wt-pin">
                          {p.verified && <circle className="wt-pin-ring" cx="0" cy="-21.6" r="15.5" />}
                          <path className="wt-pin-drop" d={PIN_D} style={{ fill: p.c }} />
                          <g className="wt-pin-ic" transform="translate(-7.5,-29.1) scale(0.625)" dangerouslySetInnerHTML={{ __html: p.icon }} />
                          {p.verified && (
                            <g transform="translate(0,-37.5)">
                              <circle className="wt-pin-badge" r="7" />
                              <path className="wt-pin-tick" d="M-3,0.2 L-1,2.4 L3.2,-2.6" />
                            </g>
                          )}
                        </g>
                      </g>
                    ))}
                  </svg>
                </span>
                {/* Vějíř karet profíků — Jirka uprostřed (čitelný), 2 po stranách ztlumené; před mapou */}
                <span className="wt-fan" aria-hidden="true">
                  <span className="wt-fan-card wt-fan-l"><span className="wt-fan-sym"><Users size={26} /></span><span className="wt-fan-lines"><i /></span></span>
                  <span className="wt-fan-card wt-fan-r"><span className="wt-fan-sym"><HeartPulse size={26} /></span><span className="wt-fan-lines"><i /></span></span>
                  <span className="wt-fan-card wt-fan-c">
                    <span className="wt-fan-badge"><Check size={11} /> Ověřeno</span>
                    <span className="wt-fan-photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/jirka.png" alt="Jiří Machek" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
                      <span className="wt-fan-cap"><b>Jiří Machek</b><span>Trenér II. třídy · MS GEM</span></span>
                    </span>
                    <span className="wt-fan-body">
                      <span className="wt-fan-rate">{[0, 1, 2, 3, 4].map((s) => <Star key={s} size={11} fill="#bf9a47" color="#bf9a47" />)}<b>5,0</b><i>· 100+ dětí</i></span>
                      <span className="wt-fan-btn">Zobrazit profil</span>
                    </span>
                  </span>
                </span>
                {/* obecné info — vlevo dole */}
                <span className="world-in wt-in">
                  <span className="world-tag">Trenéři a profíci</span>
                  <span className="world-sub">Trenéři, vyplétači, fyzio, fitness i areály — vyber si ověřeného profíka.</span>
                  <span className="world-go">Vstoupit <ArrowRight size={16} /></span>
                </span>
              </Link>
            </div>

            {/* JAK VÁM MŮŽEME POMOCI — naváděcí podpora pro rodiče */}
            <div className="help rv d3">
              <h2 className="help-title">Jak vám můžeme pomoci?</h2>
              <div className="help-opts">
                <Link href="/mapa" className="help-opt"><span className="help-ic"><Search size={20} /></span><span>Najít trenéra pro dítě</span><ArrowRight size={16} className="help-arr" /></Link>
                <Link href="/mapa" className="help-opt"><span className="help-ic"><MapPin size={20} /></span><span>Najít kurt nebo klub poblíž</span><ArrowRight size={16} className="help-arr" /></Link>
                <Link href="/videorozbor" className="help-opt"><span className="help-ic"><Video size={20} /></span><span>Dítě ztrácí radost / něco mu nejde</span><ArrowRight size={16} className="help-arr" /></Link>
                <Link href="/moje-cesta" className="help-opt"><span className="help-ic"><CalendarCheck size={20} /></span><span>Sledovat pokrok (Moje cesta)</span><ArrowRight size={16} className="help-arr" /></Link>
                <Link href="/sparring" className="help-opt"><span className="help-ic"><Handshake size={20} /></span><span>Najít sparring partnera</span><ArrowRight size={16} className="help-arr" /></Link>
                <Link href="/poradna" className="help-opt"><span className="help-ic"><MessageCircle size={20} /></span><span>Poradit se s odborníkem</span><ArrowRight size={16} className="help-arr" /></Link>
                <Link href="/turnaje" className="help-opt"><span className="help-ic"><Trophy size={20} /></span><span>Turnaje v okolí</span><ArrowRight size={16} className="help-arr" /></Link>
                <Link href="/forum" className="help-opt"><span className="help-ic"><Users size={20} /></span><span>Komunita rodičů</span><ArrowRight size={16} className="help-arr" /></Link>
                <Link href="/clanky" className="help-opt"><span className="help-ic"><Star size={20} /></span><span>Rady a návody (knihovna)</span><ArrowRight size={16} className="help-arr" /></Link>
                <Link href="/bazar" className="help-opt"><span className="help-ic"><Award size={20} /></span><span>Bazar vybavení z druhé ruky</span><ArrowRight size={16} className="help-arr" /></Link>
                <Link href="/pro-trenery" className="help-opt"><span className="help-ic"><GraduationCap size={20} /></span><span>Jsem trenér — chci klienty</span><ArrowRight size={16} className="help-arr" /></Link>
                <Link href="/pro-trenery" className="help-opt"><span className="help-ic"><HeartPulse size={20} /></span><span>Jsem fyzioterapeut</span><ArrowRight size={16} className="help-arr" /></Link>
                <Link href="/pro-trenery" className="help-opt"><span className="help-ic"><Dumbbell size={20} /></span><span>Jsem kondiční trenér</span><ArrowRight size={16} className="help-arr" /></Link>
                <Link href="/pro-trenery" className="help-opt"><span className="help-ic"><Building2 size={20} /></span><span>Jsem vyplétač / mám areál</span><ArrowRight size={16} className="help-arr" /></Link>
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
          <span className="hstat"><b><Counter to={rodice} /></b><i>rodičů</i></span>
          <span className="hstat"><b><Counter to={deti} /></b><i>dětí</i></span>
          <span className="hstat" title="Trenéři, fitness, fyzio, vyplétači, hráči"><b><Counter to={profici} /></b><i>profíků</i></span>
          <span className="hstat"><b>{CITIES.length}</b><i>měst</i></span>
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
              {!isMemberHome && <Link href="/pristup" className="btn btn-out">Staň se členem</Link>}
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



      {/* CENA / ČLENSTVÍ — HUB+ / PROFI+ + BOOST */}
      <CenaClenstvi member={isMemberHome} />

      {/* CTA */}
      <section className="sec cta" id="cta">
        <div className="wrap">
          <span className="eyebrow rv" style={{ justifyContent: "center", display: "flex" }}>Pojďme na to</span>
          <h2 className="rv">Pomozte dítěti začít, růst a vydržet u tenisu</h2>
          <p className="rv d1">Přehled, podpora a kontakty na jednom místě — celý tenisový klub pro vaše dítě za 99 Kč měsíčně.</p>
          {isMemberHome
            ? <Link href="/moje-cesta" className="btn btn-gold rv d2">Otevřít Moji cestu <ArrowRight className="ic" size={18} /></Link>
            : <Link href="/pristup" className="btn btn-gold rv d2">Staň se členem <ArrowRight className="ic" size={18} /></Link>}
        </div>
      </section>

      <AskUs />


      <VideoNudge side="left" bottom={18} delay={1200} photo="/videorozbor-1.png"
        title="Nebaví vaše dítě tenis?" sub={"Poradíme proč — videorozbor & konzultace →"} />
      <VideoNudge side="right" bottom={108} delay={3200} photo="/videorozbor-2.png"
        title={"Videorozbor & konzultace"} sub={"Placená služba: rozbor techniky, pohybu i hlavy →"} />
    </>
  );
}
