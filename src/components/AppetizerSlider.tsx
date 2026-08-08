"use client";

// APPETIZER — hlavní prodejní blok homepage. Slidy s ukázkami funkcí + proč jsou skvělé
// + hook „kompletní klub za cenu dvou káv". Žádné „zdarma" — registrace = rovnou členství.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Trophy, MessageSquareHeart, LineChart, Swords, BookOpen, ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";

// Faux-UI „screenshoty" (stylizované náhledy, ne skutečné obrázky — vypadají nativně a jdou vyměnit).
const MockCesta = () => (
  <div className="ap-ui ap-ui-cesta">
    <div className="ap-axis"><span style={{ background: "#3b8a5a", width: "42%" }}>Příprava</span><span style={{ background: "#bf9a47", width: "36%" }}>Sezóna</span><span style={{ background: "#cdd3da", width: "22%" }}>Mezi</span></div>
    <div className="ap-cal">{Array.from({ length: 35 }).map((_, i) => { const t = [3, 7, 8, 12, 17, 21, 24, 28].includes(i) ? "t" : [10, 19, 26].includes(i) ? "m" : [14].includes(i) ? "r" : ""; return <span key={i} className={`ap-cell ${t}`} />; })}</div>
    <div className="ap-legend"><span><i className="t" />trénink</span><span><i className="m" />turnaj</span><span><i className="r" />volno</span></div>
  </div>
);
const MockZebricek = () => (
  <div className="ap-ui ap-ui-list">
    {[["1.", "Adam N.", "1 240", ""], ["2.", "Vaše dítě", "1 180", "me"], ["3.", "Tomáš K.", "1 095", ""], ["4.", "Eliška P.", "1 010", ""]].map(([p, n, b, c]) => (
      <div className={`ap-row ${c}`} key={n}><span className="ap-pos">{p}</span><span className="ap-nm">{n}</span><span className="ap-pts">{b}</span></div>
    ))}
    <div className="ap-badge-live"><Sparkles size={12} /> automaticky ze svazu</div>
  </div>
);
const MockPoradna = () => (
  <div className="ap-ui ap-ui-chat">
    <div className="ap-q">Má jet dcera (9) na krajský turnaj, nebo je brzy?</div>
    <div className="ap-a"><b>Trenér Jiří</b><span>Klidně jeďte — v tomhle věku jde o zkušenost, ne o výsledek. Před turnajem doporučuju…</span></div>
    <div className="ap-a-tag">odpověď do 48 h</div>
  </div>
);
const MockOhlednuti = () => (
  <div className="ap-ui ap-ui-stats">
    <div className="ap-bars">{[60, 40, 75, 55, 90, 70].map((h, i) => <span key={i} style={{ height: `${h}%` }} className={i === 4 ? "hi" : ""} />)}</div>
    <div className="ap-stat-row"><div><b>72 %</b><span>úspěšnost</span></div><div><b>81 %</b><span>dotažení 1. setu</span></div></div>
  </div>
);
const MockSparring = () => (
  <div className="ap-ui ap-ui-spar">
    {[["Kuba, 10", "antuka · Praha 6"], ["Nela, 9", "hala · Praha 5"]].map(([n, m]) => (
      <div className="ap-spar-card" key={n}><span className="ap-av">{n[0]}</span><div><b>{n}</b><span>{m}</span></div><span className="ap-vs">Vyzvat</span></div>
    ))}
  </div>
);
const MockKnihovna = () => (
  <div className="ap-ui ap-ui-lib">
    {["Jak vybrat první raketu podle věku", "Kdy je dítě připravené na turnaj", "Tenisový loket u dětí — prevence"].map((t) => (
      <div className="ap-art" key={t}><span className="ap-art-ic"><BookOpen size={14} /></span><span>{t}</span></div>
    ))}
  </div>
);

const SLIDES = [
  { Icon: CalendarDays, tag: "Moje cesta", title: "Celá sezóna dítěte přehledně", why: "Kalendář tréninků, turnajů i volna. Rodič konečně vidí, kam to celé směřuje — bez chaosu v hlavě.", Mock: MockCesta },
  { Icon: Trophy, tag: "Žebříček", title: "Postavení a výsledky samy ze svazu", why: "Žebříček i zápasy se doplní automaticky. Žádné hledání po webech svazu — máte to na jednom místě.", Mock: MockZebricek },
  { Icon: MessageSquareHeart, tag: "Poradna", title: "Kdykoli si nejste jistí, tým odpoví", why: "Výběr trenéra, turnaj, výbava, bolest lokte… Zeptáte se a odborník odpoví do 48 hodin. Klid místo googlení.", Mock: MockPoradna },
  { Icon: LineChart, tag: "Ohlédnutí", title: "Kdy a proč vaše dítě vyhrává", why: "Rozbor zápasů ze setů: úspěšnost, dotahování, otočky. Uvidíte pokrok černé na bílém.", Mock: MockOhlednuti },
  { Icon: Swords, tag: "Sparring", title: "Parťák na úrovni vašeho dítěte", why: "Najděte spoluhráče podle věku, úrovně i lokality. Víc zápasů = rychlejší růst.", Mock: MockSparring },
  { Icon: BookOpen, tag: "Knihovna & komunita", title: "Návody, fórum i bazar pohromadě", why: "Ověřené návody, zkušenosti ostatních rodičů a bazar vybavení. Vše, na co jinde bloudíte hodiny.", Mock: MockKnihovna },
];

export function AppetizerSlider() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = SLIDES.length;
  const go = (d: number) => setI((x) => (x + d + n) % n);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setI((x) => (x + 1) % n), 4200);
    return () => clearInterval(id);
  }, [paused, n]);

  const S = useMemo(() => SLIDES[i], [i]);
  const Mock = S.Mock;
  const Icon = S.Icon;

  return (
    <section className="appetizer" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="wrap">
        <span className="app-eyebrow rv"><Sparkles size={15} /> Podívejte se dovnitř klubu</span>
        <h2 className="app-h rv d1">Kompletní tenisový klub pro vaše dítě <span className="g">za cenu dvou káv</span></h2>
        <p className="app-sub rv d1">Všechno, co tenisový rodič potřebuje, na jednom místě. Jedno členství — <b>200 Kč měsíčně</b>. Žádné nástrahy, žádný balast.</p>

        <div className="app-stage rv d2">
          <button className="app-nav app-prev" onClick={() => go(-1)} aria-label="Předchozí"><ChevronLeft size={22} /></button>
          <div className="app-slide" key={i}>
            <div className="app-shot"><Mock /></div>
            <div className="app-copy">
              <span className="app-tag"><Icon size={15} /> {S.tag}</span>
              <h3>{S.title}</h3>
              <p>{S.why}</p>
              <span className="app-incl">✓ součást členství</span>
            </div>
          </div>
          <button className="app-nav app-next" onClick={() => go(1)} aria-label="Další"><ChevronRight size={22} /></button>
        </div>

        <div className="app-dots">
          {SLIDES.map((s, k) => (
            <button key={k} className={`app-dot${k === i ? " on" : ""}`} onClick={() => setI(k)} aria-label={s.tag} />
          ))}
        </div>

        <div className="app-cta rv d2">
          <Link href="/prihlaseni?tab=reg" className="btn btn-gold app-join">Staň se členem — 200 Kč/měsíc <ArrowRight size={18} /></Link>
          <span className="app-fine">Kompletní servis za cenu dvou káv. Členství můžeš kdykoli zrušit.</span>
        </div>
      </div>
    </section>
  );
}
