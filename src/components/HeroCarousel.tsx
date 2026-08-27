"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Users, GraduationCap, Trophy, Search, Handshake, Sparkles, type LucideIcon } from "lucide-react";

type Slide = { who: string; title: ReactNode; sub: string; Icon: LucideIcon };

// Vždy první (identita webu) → rodič → trenér → kariéra dítěte → najít trenéra → sparring.
const SLIDES: Slide[] = [
  {
    Icon: Sparkles,
    who: "Rodiče i tenisoví profíci — na jednom místě",
    title: <>První online <span className="g">tenisový klub</span></>,
    sub: "Ověření trenéři, kluby a odborníci, chytré nástroje a komunita — se vším všudy. Vyzkoušejte týden zdarma; zakládající cenu si udrží jen členové, kteří se přidají letos.",
  },
  {
    Icon: Users,
    who: "Pro rodiče malých tenistů",
    title: <>Víme, jak těžké je <span className="g">zorientovat se v tenise</span></>,
    sub: "Sdružujeme ověřené trenéry, kluby i praktické návody — aby vaše dítě mohlo začít, růst a vydržet u tenisu.",
  },
  {
    Icon: GraduationCap,
    who: "Pro trenéry",
    title: <>Buďte vidět — <span className="g">klienti si vás najdou</span>. Zdarma.</>,
    sub: "Profil na mapě, kalendář, rezervace i správa svěřenců — vše přehledně na jednom místě, bez poplatku za rozhraní.",
  },
  {
    Icon: Trophy,
    who: "Pro závodní hráče a jejich rodiče",
    title: <><span className="g">Celá kariéra</span> dítěte přehledně</>,
    sub: "Profil hráče, výsledky, žebříček, plánování turnajů i tým specialistů — vše na jednom místě.",
  },
  {
    Icon: Search,
    who: "Pro rodiče malých tenistů",
    title: <>Najděte <span className="g">trenéra</span> kousek od vás</>,
    sub: "Ověřené profily, ceny i recenze na jednom místě — a domluvíte se na pár kliků.",
  },
  {
    Icon: Handshake,
    who: "Pro hráče a sparring partnery",
    title: <>Najděte si <span className="g">vhodný sparring</span></>,
    sub: "Parťáci podle úrovně, místa i stylu hry — a domluva zápasu přímo přes web.",
  },
];

export function HeroCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0 });
  const [i, setI] = useState(0);

  const goTo = (n: number) => {
    const t = trackRef.current;
    if (t) t.scrollTo({ left: n * t.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const id = setInterval(() => {
      const t = trackRef.current;
      if (!t || drag.current.active) return;
      const next = (Math.round(t.scrollLeft / t.clientWidth) + 1) % SLIDES.length;
      t.scrollTo({ left: next * t.clientWidth, behavior: "smooth" });
    }, 6000);
    return () => clearInterval(id);
  }, []);

  const onScroll = () => {
    const t = trackRef.current;
    if (!t) return;
    const n = Math.round(t.scrollLeft / t.clientWidth);
    setI((cur) => (n !== cur ? n : cur));
  };

  // drag jen myší (dotyk = nativní scroll)
  const down = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const t = trackRef.current;
    if (!t) return;
    drag.current = { active: true, startX: e.clientX, startScroll: t.scrollLeft };
    t.style.scrollSnapType = "none";
    try { t.setPointerCapture(e.pointerId); } catch { /* */ }
  };
  const move = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const t = trackRef.current;
    if (t) t.scrollLeft = drag.current.startScroll - (e.clientX - drag.current.startX);
  };
  const up = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    const t = trackRef.current;
    if (!t) return;
    t.style.scrollSnapType = "";
    goTo(Math.round(t.scrollLeft / t.clientWidth));
  };

  return (
    <div className="hcaro">
      <div className="hcaro-track" ref={trackRef} onScroll={onScroll} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}>
        {SLIDES.map((s, n) => (
          <div className="hcaro-slide" key={n}>
            <span className="hcaro-ic"><s.Icon size={22} /></span>
            <span className="hcaro-who">{s.who}</span>
            <h1>{s.title}</h1>
            <p className="sub">{s.sub}</p>
          </div>
        ))}
      </div>
      <div className="hcaro-dots" role="tablist" aria-label="Pro koho je TenisHub">
        {SLIDES.map((sl, n) => (
          <button key={n} type="button" role="tab" aria-selected={n === i} aria-label={sl.who} className={n === i ? "on" : ""} onClick={() => { setI(n); goTo(n); }} />
        ))}
      </div>
    </div>
  );
}
