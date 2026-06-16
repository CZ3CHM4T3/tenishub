"use client";

import { useEffect, useState, type ReactNode } from "react";

type Slide = { who: string; title: ReactNode; sub: string };

const SLIDES: Slide[] = [
  {
    who: "Komunita — doposud neexistující služba pro rodiče",
    title: <>Víme, jak těžké je <span className="g">zorientovat se v tenise</span></>,
    sub: "Sdružujeme ověřené trenéry, kurty, fyzio i praktické návody — aby vaše dítě mohlo začít, růst a vydržet u tenisu.",
  },
  {
    who: "Pro rodiče malých tenistů",
    title: <>Najděte <span className="g">trenéra i kurt</span> kousek od vás</>,
    sub: "Ověřené profily, ceny i recenze na jednom místě — a domluvíte se na pár kliků.",
  },
  {
    who: "Pro závodní hráče a jejich rodiče",
    title: <><span className="g">Celá kariéra</span> dítěte přehledně</>,
    sub: "Profil hráče, výsledky, žebříček, plánování turnajů i tým specialistů — vše na jednom místě.",
  },
  {
    who: "Pro trenéry, fyzio a kondiční trenéry",
    title: <>Noví klienti <span className="g">bez shánění</span></>,
    sub: "Buďte vidět na mapě, spravujte si profil a přijímejte poptávky od hráčů.",
  },
  {
    who: "Pro hráče a sparring partnery",
    title: <>Najděte si, <span className="g">s kým hrát</span></>,
    sub: "Parťáci podle úrovně, místa i stylu hry — a domluva zápasu přímo přes web.",
  },
  {
    who: "Pro kluby a areály",
    title: <>Naplňte <span className="g">volné kurty</span></>,
    sub: "Zviditelněte areál, propojte se s trenéry i hráči a přiveďte hráče na kurty.",
  },
];

export function HeroCarousel() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setI((x) => (x + 1) % SLIDES.length), 6000);
    return () => clearTimeout(t);
  }, [i]);

  const s = SLIDES[i];
  return (
    <div className="hcaro">
      <div className="hcaro-slide" key={i}>
        <span className="hcaro-who">{s.who}</span>
        <h1>{s.title}</h1>
        <p className="sub">{s.sub}</p>
      </div>
      <div className="hcaro-dots" role="tablist" aria-label="Pro koho je TenisHub">
        {SLIDES.map((sl, n) => (
          <button
            key={n}
            type="button"
            role="tab"
            aria-selected={n === i}
            aria-label={sl.who}
            className={n === i ? "on" : ""}
            onClick={() => setI(n)}
          />
        ))}
      </div>
    </div>
  );
}
