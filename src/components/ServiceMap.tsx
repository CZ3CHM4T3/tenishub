"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { Users, Handshake, Building2, HeartPulse, Dumbbell, Grid3x3, Lock, Check } from "lucide-react";
import { IconRun } from "@tabler/icons-react";
import { WhistleIcon } from "./icons";

type IconType = ComponentType<{ size?: number }>;
type Func = { label: string; href?: string; soon?: boolean };
type Service = { key: string; label: string; sub?: string; tagline: string; fill: string; color: string; Icon: IconType };

const SERVICES: Service[] = [
  { key: "trener", label: "Trenér", tagline: "klienti & nástroje", fill: "#EEEDFE", color: "#7C4DD6", Icon: WhistleIcon },
  { key: "rodic", label: "Rodič", sub: "hobby · závodní", tagline: "jistota & pohodlí", fill: "#F2EAD6", color: "#7c6018", Icon: Users },
  { key: "hrac", label: "Hráč", sub: "amatér · závodní", tagline: "hraj & zlepšuj se", fill: "#E5ECF1", color: "#3b5666", Icon: IconRun },
  { key: "sparring", label: "Sparring", tagline: "parťák na zápas", fill: "#F2E6DF", color: "#8a5640", Icon: Handshake },
  { key: "areal", label: "Areály", tagline: "plné kurty", fill: "#E0EBE9", color: "#2f5d57", Icon: Building2 },
  { key: "fyzio", label: "Fyzio", tagline: "rehabilitace", fill: "#F2E5E9", color: "#864a59", Icon: HeartPulse },
  { key: "fitness", label: "Fitness", tagline: "kondice & síla", fill: "#E8ECF4", color: "#4a5b86", Icon: Dumbbell },
  { key: "vyplet", label: "Vyplétání", tagline: "servis raket", fill: "#E6E9ED", color: "#5a6470", Icon: Grid3x3 },
];

// Realistická hranice ČR (z reálných souřadnic, vč. výběžků).
const CZ_BORDER =
  "-70,207 -61,186 -45,192 -27,196 -6,192 19,178 56,165 81,144 117,139 148,122 153,99 161,90 176,93 187,101 " +
  "190,120 213,119 230,98 248,101 260,120 270,135 307,139 336,162 356,156 372,152 381,165 362,196 381,212 " +
  "392,236 408,244 423,226 428,191 453,197 482,215 500,215 512,205 516,225 537,247 548,257 574,266 599,274 " +
  "601,300 628,335 599,366 558,409 551,424 526,432 493,449 456,441 431,480 401,454 340,459 318,441 247,428 " +
  "233,457 208,486 173,485 161,489 133,483 110,456 76,424 42,391 12,364 -14,345 -38,297 -22,271 -29,258 " +
  "-52,249 -59,231";

// Projekce reálných GPS → souřadnice této SVG mapy.
// Afinní transformace kalibrovaná na 12 krajských měst (sedí na ~2 px).
const projX = (lng: number) => 102.7 * lng - 1311;
const projY = (lat: number) => -160.7 * lat + 8293.2;

// REÁLNÉ body (žádné vymyšlené) — [lat, lng, index služby].
// index: 0 = trenér/škola (coach+academy), 4 = areál/klub, 5 = fyzio, 6 = fitness.
const REAL_POINTS: [number, number, number][] = [
  // trenéři a tenisové školy
  [50.0830, 14.4200, 0], [50.0700, 14.4520, 0], [50.0855, 14.4920, 0], [50.1230, 14.4100, 0],
  [50.0905, 14.4710, 0], [50.0610, 14.4020, 0], [50.0500, 14.4350, 0], [50.0420, 14.4460, 0],
  [50.0540, 14.4640, 0], [50.1300, 14.4720, 0], [50.1010, 14.6200, 0], [50.0790, 14.4010, 0],
  [50.0720, 14.5010, 0], [49.1951, 16.6068, 0], [49.2010, 16.6120, 0], [49.7475, 13.3776, 0],
  [50.2092, 15.8328, 0], [49.8400, 18.2900, 0], [49.8250, 18.2000, 0], [49.8350, 18.2700, 0],
  [49.7800, 18.3200, 0], [49.5900, 17.2600, 0], [50.6400, 13.8300, 0], [49.4000, 15.5900, 0],
  [49.5630, 15.9400, 0],
  // fyzio
  [50.0780, 14.4480, 5], [50.0820, 14.4500, 5], [50.0520, 14.4300, 5], [50.0010, 14.4100, 5],
  [50.0850, 14.4300, 5], [49.2000, 16.6100, 5], [49.2100, 16.6000, 5], [49.2200, 16.5900, 5],
  [49.1900, 16.6100, 5], [50.1000, 14.5000, 5],
  // fitness / kondice
  [49.1900, 16.6100, 6],
  // areály / kluby
  [50.0940, 14.4440, 4], [50.0300, 14.4300, 4], [49.2000, 16.5900, 4], [49.1900, 16.5800, 4],
  [49.2300, 16.5900, 4], [49.2200, 16.5200, 4], [49.8380, 18.2850, 4], [49.8420, 18.2900, 4],
  [49.5900, 17.2700, 4], [49.5900, 17.2500, 4], [49.5800, 17.2800, 4], [49.6200, 17.3100, 4],
  [49.7400, 13.3900, 4], [49.7400, 13.3700, 4], [49.7500, 13.3800, 4], [50.7700, 15.0600, 4],
  [50.7600, 15.0500, 4], [50.7700, 15.0700, 4], [50.7680, 15.0580, 4], [49.9270, 14.2790, 4],
  [50.2100, 15.8500, 4], [50.2100, 15.8100, 4], [50.2000, 15.8300, 4], [50.2050, 15.8400, 4],
  [50.0380, 15.7790, 4], [48.9750, 14.4800, 4], [48.9700, 14.4900, 4], [48.9800, 14.4700, 4],
  [49.4720, 17.1110, 4], [49.4700, 17.1100, 4], [49.2240, 17.6670, 4], [50.6610, 14.0400, 4],
  [50.2320, 12.8710, 4], [49.3970, 15.5910, 4], [49.4000, 15.5900, 4], [49.5630, 15.9390, 4],
  [49.6830, 18.3500, 4], [49.8540, 18.5410, 4], [49.8500, 18.5400, 4], [50.6400, 13.8250, 4],
  [50.6450, 13.8300, 4], [50.4600, 13.4180, 4], [50.4110, 14.9030, 4], [50.4000, 14.9100, 4],
  [49.4550, 17.4510, 4], [49.0700, 17.4600, 4], [48.7590, 16.8820, 4], [48.8560, 16.0490, 4],
  [49.2980, 17.3930, 4],
  // menší a okresní města
  [50.1810, 12.6400, 4], [50.0790, 12.3700, 4], [49.4400, 12.9290, 4], [50.0280, 15.2000, 4],
  [49.9480, 15.2680, 4], [49.9640, 14.0720, 4], [49.9740, 16.3940, 4], [50.5610, 15.9120, 4],
  [49.4720, 17.9710, 4], [49.3390, 17.9960, 4], [49.2770, 16.9990, 4], [48.8550, 17.1320, 4],
  [50.0740, 14.8600, 4], [50.3500, 14.4740, 4], [50.3470, 14.1030, 4], [49.3090, 14.1470, 4],
  [49.2620, 13.9020, 4], [48.8290, 14.4640, 4], [49.2310, 13.5200, 4], [50.3270, 13.5460, 4],
  [50.7730, 14.1940, 4], [49.7810, 14.6870, 4],
  // areály objevené přes coach-stránky
  [49.8320, 18.1660, 4], [50.1930, 14.6820, 4], [49.4580, 17.4480, 4],
  // TRENÉRSKÝ pin u každého klubu, kde reálně máme trenéry (1 pin = „tady se trénuje",
  // ne hromada; kluboví trenéři jsou pak v profilu areálu). Mírně odsazeno od pinu areálu.
  [50.0985, 14.4505, 0], // I. ČLTK Praha
  [50.0345, 14.4360, 0], // TK Konstruktiva
  [49.2285, 17.6730, 0], // TK Zlín
  [49.4765, 17.1170, 0], // TK AGROFERT Prostějov
  [49.1945, 16.5860, 0], // ŽLTC Brno
  [49.7445, 13.3960, 0], // TJ Lokomotiva Plzeň
  [50.2145, 15.8560, 0], // Teniscentrum DTJ HK
  [49.2045, 16.5960, 0], // TC Brno
  [49.5945, 17.2760, 0], // TK MILO Olomouc
  [49.8365, 18.1720, 0], // TJ Start Ostrava-Poruba
  [50.1975, 14.6880, 0], // LTC Houštka
  [49.4620, 17.4540, 0], // TK Precheza Přerov
  // samostatní trenéři Tenisové školy SPIN (Brno/Ostrava/Praha)
  [49.1980, 16.6020, 0], [49.1920, 16.6110, 0], [49.2000, 16.5980, 0], [49.1880, 16.6150, 0], [49.2030, 16.6070, 0],
  [49.8400, 18.2850, 0], [49.8310, 18.2960, 0], [49.8380, 18.3000, 0],
  [50.0850, 14.4300, 0], [50.0750, 14.4120, 0], [50.0900, 14.4250, 0],
];

// Role „spotřebitelské" (nemají vlastní piny) — hover na jejich kartu rozsvítí CELOU mapu.
const CONSUMER = new Set(["rodic", "hrac", "sparring"]);

// Role, které mají dvě podvarianty (přepínač v menu, viditelné hned).
const VARIANTS: Record<string, { key: string; label: string }[]> = {
  rodic: [{ key: "hobby", label: "Rodič hobby hráče" }, { key: "zavodni", label: "Rodič závodního hráče" }],
  hrac: [{ key: "amater", label: "Hráč amatér" }, { key: "zavodni", label: "Hráč závodní" }],
};

// Funkce per role: ZDARMA vs HUB+ (zobrazí se po kliknutí na kartu).
// Role s podvariantami mají klíče "role:varianta".
const FUNCS: Record<string, { free: Func[]; member: Func[] }> = {
  trener: {
    free: [
      { label: "Vizitka v katalogu", href: "/trener" },
      { label: "Být k nalezení na mapě", href: "/mapa" },
      { label: "Veřejné recenze", soon: true },
    ],
    member: [
      { label: "Kalendář a online rezervace", href: "/trener" },
      { label: "Platby předem (GoPay)", href: "/trener" },
      { label: "Správa klientů a omluvenky", soon: true },
      { label: "Ověřený odznak a top pozice", soon: true },
      { label: "Články a FAQ návody", soon: true },
    ],
  },
  "rodic:hobby": {
    free: [
      { label: "Najít trenéra, kurt i fyzio", href: "/mapa" },
      { label: "Profily a recenze", href: "/trener" },
      { label: "Prohlížet sparring nabídky", href: "/sparring" },
    ],
    member: [
      { label: "Moje cesta — deník tréninků a volna dítěte", soon: true },
      { label: "Rezervace a platby na pár kliků", href: "/trener" },
      { label: "Zprávy trenérům", href: "/trener" },
      { label: "Připomínky lekcí a plateb", soon: true },
      { label: "Články a FAQ návody", soon: true },
    ],
  },
  "rodic:zavodni": {
    free: [
      { label: "Najít špičkové specialisty", href: "/mapa" },
      { label: "Profily a recenze", href: "/trener" },
      { label: "Veřejné žebříčky a výsledky", soon: true },
    ],
    member: [
      { label: "Moje cesta — kalendář kariéry dítěte", soon: true },
      { label: "Profil hráče, výsledky a žebříček", soon: true },
      { label: "Plánovač turnajů s detaily", soon: true },
      { label: "Tréninkový plán = checklist v kalendáři", soon: true },
      { label: "Matchmaking se sparringy", soon: true },
    ],
  },
  "hrac:amater": {
    free: [
      { label: "Mapa kurtů a trenérů", href: "/mapa" },
      { label: "Prohlížet sparring", href: "/sparring" },
      { label: "Profily a recenze", href: "/trener" },
    ],
    member: [
      { label: "Rezervace kurtů a lekcí", href: "/trener" },
      { label: "Sparring matchmaking", soon: true },
      { label: "Zprávy a domluva zápasů", soon: true },
      { label: "Připomínky rezervací", soon: true },
      { label: "Články a FAQ návody", soon: true },
    ],
  },
  "hrac:zavodni": {
    free: [
      { label: "Mapa kurtů a trenérů", href: "/mapa" },
      { label: "Prohlížet sparring", href: "/sparring" },
      { label: "Veřejné žebříčky", soon: true },
    ],
    member: [
      { label: "Statistiky a forma", soon: true },
      { label: "Video-analýza zápasů", soon: true },
      { label: "Tým specialistů (trenér/fyzio/kondice)", soon: true },
      { label: "Turnaje a ligy", soon: true },
      { label: "Články a FAQ návody", soon: true },
    ],
  },
  sparring: {
    free: [
      { label: "Prohlížet sparring nabídky", href: "/sparring" },
    ],
    member: [
      { label: "Vlastní sparring inzerát", href: "/sparring" },
      { label: "Kontaktovat parťáka", href: "/sparring" },
      { label: "Matchmaking podle úrovně", soon: true },
      { label: "Hodnocení po zápase", soon: true },
      { label: "Články a FAQ návody", soon: true },
    ],
  },
  areal: {
    free: [
      { label: "Profil areálu na mapě", href: "/mapa" },
      { label: "Kontakty a otevírací doba", href: "/areal" },
    ],
    member: [
      { label: "Rezervační systém + platby", href: "/areal" },
      { label: "Obsaď volný kurt teď", href: "/areal" },
      { label: "Statistiky vytíženosti", soon: true },
      { label: "Napojení trenérů", soon: true },
      { label: "Články a FAQ návody", soon: true },
    ],
  },
  fyzio: {
    free: [
      { label: "Profil fyzia na mapě", href: "/mapa" },
      { label: "Veřejné recenze", href: "/trener" },
    ],
    member: [
      { label: "Online objednávky termínů", href: "/trener" },
      { label: "Poptávky od hráčů (leady)", soon: true },
      { label: "Rehabilitační plány online", soon: true },
      { label: "Ověřený odznak", soon: true },
      { label: "Články a FAQ návody", soon: true },
    ],
  },
  fitness: {
    free: [
      { label: "Profil kondičního trenéra na mapě", href: "/mapa" },
      { label: "Veřejné recenze", href: "/trener" },
    ],
    member: [
      { label: "Online objednávky tréninků", href: "/trener" },
      { label: "Poptávky od hráčů a rodičů", soon: true },
      { label: "Prodej kondičních programů", soon: true },
      { label: "Ověřený odznak", soon: true },
      { label: "Články a FAQ návody", soon: true },
    ],
  },
  vyplet: {
    free: [
      { label: "Vizitka v katalogu", href: "/mapa" },
      { label: "Kontakt a ceník výpletů" },
      { label: "Veřejné recenze", soon: true },
    ],
    member: [
      { label: "Pin na mapě + top pozice", href: "/mapa" },
      { label: "Online objednávka vyplétání", soon: true },
      { label: "Poptávky od hráčů a klubů", soon: true },
      { label: "Ceník výpletů a skladem strun", soon: true },
      { label: "Ověřený odznak", soon: true },
      { label: "Články a FAQ návody", soon: true },
    ],
  },
};

function Pin({ x, y, svc, big, lit, onHover }: { x: number; y: number; svc: Service; big: boolean; lit: boolean; onHover: (k: string | null) => void }) {
  const r = big ? 15 : 9.5;
  const PinIcon = svc.Icon;
  return (
    <g
      className={`map-pin${lit ? " lit" : ""}${big ? " big" : ""}`}
      onMouseEnter={() => onHover(svc.key)}
      onMouseLeave={() => onHover(null)}
    >
      <circle className="pin-halo" cx={x} cy={y} r={r + 9} fill={svc.color} />
      <circle className="pin-body" cx={x} cy={y} r={r} fill="#ffffff" stroke={svc.color} strokeWidth={big ? 2.6 : 2} filter="url(#pinShadow)" />
      <foreignObject x={x - (big ? 8.5 : 5.5)} y={y - (big ? 8.5 : 5.5)} width={big ? 17 : 11} height={big ? 17 : 11}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: svc.color }}>
          <PinIcon size={big ? 16 : 10.5} />
        </div>
      </foreignObject>
    </g>
  );
}

export function ServiceMap({ showMap = true, showCards = true, hideKeys = [] }: { showMap?: boolean; showCards?: boolean; hideKeys?: string[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [selVar, setSelVar] = useState<string>("");
  const selSvc = SERVICES.find((s) => s.key === sel) ?? null;
  const variants = sel ? VARIANTS[sel] : undefined;
  const funcKey = variants ? `${sel}:${selVar || variants[0].key}` : sel ?? "";
  const funcs = funcKey ? FUNCS[funcKey] : null;

  const openCard = (key: string) => {
    setSel((v) => (v === key ? null : key));
    setSelVar(VARIANTS[key]?.[0].key ?? "");
  };

  return (
    <div className="smap-wrap">
      {/* MAPA s piny (na homepage skrytá — přesunuto do karty NAJDI) */}
      {showMap && (
      <svg className="smap" viewBox="-100 65 755 450" width="100%" role="group" aria-label="Služby po celé ČR">
        <defs>
          <filter id="pinShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#23281c" floodOpacity="0.28" />
          </filter>
          <filter id="czInk" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#2c4a3b" floodOpacity="0.16" />
          </filter>
        </defs>
        <polygon
          points={CZ_BORDER}
          fill="#2c4a3b" fillOpacity="0.035" stroke="#2c4a3b" strokeOpacity="0.32" strokeWidth="2" strokeLinejoin="round"
          filter="url(#czInk)"
        />
        {REAL_POINTS.map(([lat, lng, si], i) => {
          const svc = SERVICES[si];
          const lit = hover === svc.key || (hover !== null && CONSUMER.has(hover));
          return <Pin key={`p${i}`} x={projX(lng)} y={projY(lat)} svc={svc} big={false} lit={lit} onHover={setHover} />;
        })}
      </svg>
      )}

      {/* KARTY služeb */}
      {showCards && (<>
      <div className="svc-cards">
        {SERVICES.filter((s) => !hideKeys.includes(s.key)).map((s) => {
          const CIcon = s.Icon;
          const hl = hover === s.key || sel === s.key;
          return (
            <button
              key={s.key}
              type="button"
              className={`svc-card${hl ? " hl" : ""}`}
              style={{ ["--svc" as string]: s.color, ["--svc-fill" as string]: s.fill }}
              onMouseEnter={() => setHover(s.key)}
              onMouseLeave={() => setHover(null)}
              onClick={() => openCard(s.key)}
              aria-expanded={sel === s.key}
            >
              <span className="svc-ic"><CIcon size={24} /></span>
              <b>{s.label}</b>
              {s.sub && <span className="svc-sub">{s.sub}</span>}
              <span className="svc-tag">{s.tagline}</span>
            </button>
          );
        })}
      </div>

      {/* MENU vybrané služby (Zdarma vs HUB+) */}
      {selSvc && funcs && (
        <div className="hive-menu" style={{ borderTopColor: selSvc.color }}>
          <div className="hive-menu-head" style={{ color: selSvc.color }}>
            <span className="hm-ic" style={{ background: selSvc.fill, color: selSvc.color }}><selSvc.Icon size={20} /></span>
            {selSvc.label}
            <button className="hm-close" onClick={() => setSel(null)} aria-label="Zavřít">×</button>
          </div>
          {variants && (
            <div className="hm-variants" role="tablist" aria-label="Vyber svou roli">
              {variants.map((v) => {
                const on = (selVar || variants[0].key) === v.key;
                return (
                  <button
                    key={v.key}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    className={`hm-var${on ? " on" : ""}`}
                    style={on ? { background: selSvc.color, borderColor: selSvc.color } : { color: selSvc.color, borderColor: selSvc.color }}
                    onClick={() => setSelVar(v.key)}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          )}
          <div className="hm-group"><Check size={14} strokeWidth={3} /> Zdarma</div>
          <div className="hive-menu-grid">
            {funcs.free.map((f) =>
              f.href ? (
                <Link key={f.label} href={f.href} className="hm-item">{f.label} <span className="hm-arr">→</span></Link>
              ) : (
                <span key={f.label} className="hm-item hm-disabled">{f.label} <span className="hm-soon">brzy</span></span>
              )
            )}
          </div>
          <div className="hm-group hm-group-gold"><Lock size={13} strokeWidth={2.6} /> Pro členy</div>
          <div className="hive-menu-grid">
            {funcs.member.map((f) =>
              f.href ? (
                <Link key={f.label} href={f.href} className="hm-item hm-member">{f.label} <span className="hm-badge">HUB+</span></Link>
              ) : (
                <span key={f.label} className="hm-item hm-member hm-disabled">{f.label} <span className="hm-badge">HUB+</span></span>
              )
            )}
          </div>
        </div>
      )}
      </>)}
    </div>
  );
}
