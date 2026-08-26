import Link from "next/link";
import { Check, Flame, Users, Briefcase, ArrowRight } from "lucide-react";

// Homepage infografika členství: HUB+ (spotřebitelé) vs PRO (experti) + BOOST.
// Argument: řešíme reálné problémy, hodnota >> cena.
export function CenaClenstvi() {
  return (
    <section className="sec cena-sec" id="cena">
      <div className="wrap">
        <span className="cena-eyebrow">Členství</span>
        <h2 className="cena-h">Za cenu jedné lekce měsíčně — <span className="g">celý tenisový klub</span></h2>
        <p className="cena-sub">Žádné skryté funkce zdarma. Jedno členství, kompletní podpora. Vyber si podle toho, na které straně kurtu stojíš.</p>

        <div className="cena-grid">
          {/* HUB+ */}
          <div className="cena-card">
            <div className="cena-top">
              <span className="cena-badge hubp"><Users size={15} /> HUB+</span>
              <div className="cena-price"><b>99 Kč</b><span>/ měsíc</span></div>
            </div>
            <p className="cena-for">Pro <b>rodiče, hráče a sparingy</b>.</p>
            <ul className="cena-list">
              <li><Check size={16} /> <span><b>Najdi a oslov ověřeného trenéra i klub</b> — konec hledání po Facebooku.</span></li>
              <li><Check size={16} /> <span><b>Moje cesta</b> — celá sezóna dítěte, výsledky a volno, <b>bez vyhoření</b>.</span></li>
              <li><Check size={16} /> <span>Poradna, komunita rodičů, turnaje, sparring, knihovna.</span></li>
            </ul>
            <p className="cena-value">To všechno za <b>zlomek ceny jedné lekce</b> měsíčně.</p>
            <Link href="/pristup" className="btn btn-green cena-cta">Chci HUB+ <ArrowRight size={16} /></Link>
            <p className="cena-note">Zakládající cena 99 Kč napořád (od Nového roku 199).</p>
          </div>

          {/* PRO */}
          <div className="cena-card cena-pro">
            <div className="cena-top">
              <span className="cena-badge prop"><Briefcase size={15} /> PRO</span>
              <div className="cena-price"><b>299 Kč</b><span>/ měsíc</span></div>
            </div>
            <p className="cena-for">Pro <b>trenéry, fyzio, fitness, akademie a vyplétače</b> — kdo tenisem vydělává.</p>
            <ul className="cena-list">
              <li><Check size={16} /> <span><b>Víc klientů</b> — leady, mapa, ověřený odznak, karta co prodává.</span></li>
              <li><Check size={16} /> <span><b>Míň papírování</b> — kalendář, online rezervace, platby předem.</span></li>
              <li><Check size={16} /> <span>Vlastní klubové rozhraní a správa svěřenců.</span></li>
            </ul>
            <p className="cena-value"><b>Vyděláš to na jediné lekci</b> — zbytek měsíce je čistý zisk.</p>
            <Link href="/pro-trenery" className="btn btn-gold cena-cta">Chci PRO <ArrowRight size={16} /></Link>
            <p className="cena-note">Zakládající cena pro první experty.</p>
          </div>
        </div>

        {/* BOOST */}
        <div className="cena-boost">
          <span className="cena-boost-ic"><Flame size={22} /></span>
          <div className="cena-boost-tx">
            <b>BOOST — vaše nefér výhoda</b>
            <span>Strom dovedností a Sparing Cup: děti u vás sbírají odznaky, levelují a soupeří. Něco, co konkurence nemá — a důvod, proč u vás zůstanou. Jednorázově, pro trenéry i experty.</span>
          </div>
          <Link href="/pro-trenery" className="cena-boost-link">Jak to funguje <ArrowRight size={15} /></Link>
        </div>
      </div>
    </section>
  );
}
