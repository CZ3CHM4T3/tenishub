import Link from "next/link";
import { Check, Flame, Users, Briefcase, ArrowRight } from "lucide-react";

// Homepage infografika členství: 2 karty — HUB+ (poptávka: rodič/hráč) a PROFI+ (nabídka: profíci).
// + BOOST (jednorázový doplněk, hra pro děti). Renomé = vydělaná vrstva důvěry navrch.
export function CenaClenstvi({ member = false }: { member?: boolean }) {
  return (
    <section className="sec cena-sec" id="cena">
      <div className="wrap">
        <span className="cena-eyebrow">Členství</span>
        <h2 className="cena-h">Za cenu jedné lekce měsíčně — <span className="g">celý tenisový klub</span></h2>
        <p className="cena-sub">Jedno rozhodnutí: na které straně kurtu stojíš. Vyber si.</p>

        <div className="cena-grid two">
          {/* HUB+ — poptávka */}
          <div className="cena-card">
            <div className="cena-top">
              <span className="cena-badge hubp"><Users size={15} /> HUB+</span>
              <div className="cena-price"><b>99 Kč</b><span>/ měs</span></div>
            </div>
            <p className="cena-for">Pro <b>rodiče a hráče</b>.</p>
            <ul className="cena-list">
              <li><Check size={16} /> <span><b>Najdi a oslov ověřeného trenéra i klub</b> — konec hledání po Facebooku.</span></li>
              <li><Check size={16} /> <span><b>Moje cesta</b> — celá sezóna dítěte, výsledky a volno, bez vyhoření.</span></li>
              <li><Check size={16} /> <span>Poradna, komunita, turnaje, knihovna, bazar, spolujízda.</span></li>
              <li><Check size={16} /> <span><b>Sparring</b> + brzy appka, co vám zápas povede sudí a dá rozbor.</span></li>
            </ul>
            <p className="cena-value">Za <b>zlomek ceny jedné lekce</b> měsíčně.</p>
            {member
              ? <Link href="/moje-cesta" className="btn btn-green cena-cta">Máš aktivní — otevřít Moji cestu <ArrowRight size={16} /></Link>
              : <Link href="/pristup" className="btn btn-green cena-cta">Chci HUB+ <ArrowRight size={16} /></Link>}
            <p className="cena-note">Zakládající 99 Kč napořád (od Nového roku 199).</p>
          </div>

          {/* PROFI+ — nabídka (všichni profíci) */}
          <div className="cena-card cena-pro">
            <div className="cena-top">
              <span className="cena-badge prop"><Briefcase size={15} /> PROFI+</span>
              <div className="cena-price"><b>299 Kč</b><span>/ měs</span></div>
            </div>
            <p className="cena-for">Pro <b>trenéry, fyzio, fitness, vyplétače a areály</b> — kdo tenisem vydělává.</p>
            <ul className="cena-list">
              <li><Check size={16} /> <span><b>Základní profil na mapě zdarma</b> (pin + jméno + web). PROFI+ odemkne <b>plné nástroje</b>: foto, ceník, bio, leady, online rezervace a platby.</span></li>
              <li><Check size={16} /> <span><b>Trenér navíc:</b> vlastní klub — svěřenci, skupiny, nástěnka, kalendář, docházka.</span></li>
              <li><Check size={16} /> <span><b>Ověření a top pozice</b> se <b>vydělají renomé</b> (růstem klubu a recenzemi) — nedají se koupit.</span></li>
            </ul>
            <p className="cena-value"><b>Vyděláš to na jediné lekci</b> — zbytek je zisk.</p>
            <Link href="/pro-trenery" className="btn btn-gold cena-cta">Chci PROFI+ <ArrowRight size={16} /></Link>
            <p className="cena-note"><b>Předplať si ho (299) = vše hned — nebo se k funkcím propracuj renomé</b> (přiveď klienty a rodiče, roste ti důvěra i funkce zdarma).</p>
          </div>
        </div>

        <div className="cena-boost">
          <span className="cena-boost-ic"><Flame size={22} /></span>
          <div className="cena-boost-tx">
            <b>BOOST — volitelný doplněk pro trenéry (kupuje se zvlášť)</b>
            <span>Herní vrstva pro děti: strom dovedností + Sparing Cup. Děti sbírají odznaky, levelují a soupeří, rodiče vidí pokrok — nefér výhoda, kterou konkurence nemá. Jednorázově.</span>
          </div>
          <Link href="/pro-trenery" className="cena-boost-link">Jak to funguje <ArrowRight size={15} /></Link>
        </div>
      </div>
    </section>
  );
}
