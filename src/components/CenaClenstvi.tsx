import Link from "next/link";
import { Check, Users, Briefcase, ArrowRight } from "lucide-react";

// Homepage infografika členství: 2 karty — HUB+ (poptávka: rodič/hráč, 99 Kč) a Odborníci
// (nabídka: tenisoví a fitness trenéři = ZDARMA). Renomé = vydělaná vrstva funkcí navrch.
export function CenaClenstvi({ member = false }: { member?: boolean }) {
  return (
    <section className="sec cena-sec" id="cena">
      <div className="wrap">
        <span className="cena-eyebrow">Členství</span>
        <h2 className="cena-h">Za cenu jedné kávy měsíčně — <span className="g">celý tenisový klub</span></h2>
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
            <p className="cena-value">Za <b>cenu jedné kávy</b> měsíčně.</p>
            {member
              ? <Link href="/moje-cesta" className="btn btn-green cena-cta">Máš aktivní — otevřít Moji cestu <ArrowRight size={16} /></Link>
              : <Link href="/pristup" className="btn btn-green cena-cta">Chci HUB+ <ArrowRight size={16} /></Link>}
            <p className="cena-note">Zakládající 99 Kč napořád (od Nového roku 199).</p>
          </div>

          {/* ODBORNÍCI — nabídka (tenisoví a fitness trenéři) */}
          <div className="cena-card cena-pro">
            <div className="cena-top">
              <span className="cena-badge prop"><Briefcase size={15} /> Odborníci</span>
              <div className="cena-price"><b>Zdarma</b></div>
            </div>
            <p className="cena-for">Pro <b>tenisové a fitness trenéry</b> — kdo tenisem žije.</p>
            <ul className="cena-list">
              <li><Check size={16} /> <span><b>Profil na mapě i základní nástroje zdarma</b> — pin, profil, svěřenci, zvací odkaz.</span></li>
              <li><Check size={16} /> <span><b>Vlastní klub:</b> svěřenci, skupiny, nástěnka, kalendář, docházka.</span></li>
              <li><Check size={16} /> <span><b>Ověření a další funkce</b> rostou s <b>renomé</b> (přivedení členové a recenze) — nedají se koupit.</span></li>
            </ul>
            <p className="cena-value"><b>Buďte vidět zadarmo</b> — čím víc renomé, tím víc funkcí.</p>
            <Link href="/pro-trenery" className="btn btn-gold cena-cta">Pro odborníky <ArrowRight size={16} /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
