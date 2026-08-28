import Link from "next/link";
import { Check, Flame, Users, Briefcase, GraduationCap, ArrowRight } from "lucide-react";

// Homepage infografika členství: 3 karty — HUB+ (spotřebitelé), PRO (experti), TRENÉR+ (trenéři).
// Argument: řešíme reálné problémy, hodnota >> cena. BOOST = herní vrstva v TRENÉR+.
export function CenaClenstvi({ member = false }: { member?: boolean }) {
  return (
    <section className="sec cena-sec" id="cena">
      <div className="wrap">
        <span className="cena-eyebrow">Členství</span>
        <h2 className="cena-h">Za cenu jedné lekce měsíčně — <span className="g">celý tenisový klub</span></h2>
        <p className="cena-sub">Žádné skryté funkce zdarma. Jedno členství, kompletní podpora. Vyber si podle toho, na které straně kurtu stojíš.</p>

        <div className="cena-grid three">
          {/* HUB+ */}
          <div className="cena-card">
            <div className="cena-top">
              <span className="cena-badge hubp"><Users size={15} /> HUB+</span>
              <div className="cena-price"><b>99 Kč</b><span>/ měs</span></div>
            </div>
            <p className="cena-for">Pro <b>rodiče, hráče a sparingy</b>.</p>
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

          {/* PRO */}
          <div className="cena-card">
            <div className="cena-top">
              <span className="cena-badge prop"><Briefcase size={15} /> PRO</span>
              <div className="cena-price"><b>299 Kč</b><span>/ měs</span></div>
            </div>
            <p className="cena-for">Pro <b>fyzio, fitness, vyplétače a akademie</b> — kdo tenisem vydělává.</p>
            <ul className="cena-list">
              <li><Check size={16} /> <span><b>Víc klientů</b> — leady, mapa, ověřený odznak, karta co prodává.</span></li>
              <li><Check size={16} /> <span><b>Míň papírování</b> — kalendář, online rezervace, platby předem.</span></li>
              <li><Check size={16} /> <span>Ceník, recenze a profil plně po svém.</span></li>
            </ul>
            <p className="cena-value"><b>Vyděláš to na jediné lekci</b> — zbytek je zisk.</p>
            <Link href="/pro-trenery" className="btn btn-out cena-cta">Chci PRO <ArrowRight size={16} /></Link>
            <p className="cena-note">Zakládající cena pro první experty.</p>
          </div>

          {/* TRENÉR+ */}
          <div className="cena-card cena-pro">
            <div className="cena-top">
              <span className="cena-badge trenp"><GraduationCap size={15} /> TRENÉR+</span>
              <div className="cena-price"><b>299 Kč</b><span>/ měs</span></div>
            </div>
            <p className="cena-for">Pro <b>trenéry</b> — celý klub na jednom místě.</p>
            <ul className="cena-list">
              <li><Check size={16} /> <span><b>Všechno z PRO</b> — leady, mapa, ověření, karta, rezervace a platby.</span></li>
              <li><Check size={16} /> <span><b>Vlastní klub:</b> správa svěřenců, skupiny, nástěnka, kalendář, docházka.</span></li>
              <li><Check size={16} /> <span><b>Rodiče vidí pokrok dětí</b> (napojení na Moji cestu) — děti u vás zůstanou.</span></li>
            </ul>
            <p className="cena-value">Jedno místo pro celý klub — a <b>rodiče vás nepustí</b>.</p>
            <Link href="/pro-trenery" className="btn btn-gold cena-cta">Chci TRENÉR+ <ArrowRight size={16} /></Link>
            <p className="cena-note">Zakládající cena pro první trenéry.</p>
          </div>
        </div>

        <div className="cena-boost">
          <span className="cena-boost-ic"><Flame size={22} /></span>
          <div className="cena-boost-tx">
            <b>BOOST — volitelný doplněk (kupuje se zvlášť)</b>
            <span>Herní vrstva: strom dovedností + Sparing Cup. Děti u vás sbírají odznaky, levelují a soupeří, rodiče vidí pokrok — nefér výhoda, kterou konkurence nemá. Jednorázově, k jakémukoli členství.</span>
          </div>
          <Link href="/pro-trenery" className="cena-boost-link">Jak to funguje <ArrowRight size={15} /></Link>
        </div>
      </div>
    </section>
  );
}
