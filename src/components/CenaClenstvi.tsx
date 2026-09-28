import Link from "next/link";
import { Search, Route, Handshake, MessagesSquare, BookOpen, Trophy, Flame, Gamepad2, ArrowRight, Users } from "lucide-react";

// Homepage: NAHOŘE členství HUB+ pro RODIČE (co dostanou za 99, s ikonami),
// POD tím oranžové JEDNORÁZOVÉ balíčky pro TRENÉRY (BOOST + herní strom).
const HUB_BENEFITS = [
  { Icon: Search, t: "Najdi a oslov trenéra i klub", d: "Ověření odborníci na mapě — konec hledání po Facebooku." },
  { Icon: Route, t: "Moje cesta", d: "Celá sezóna dítěte: tréninky, zápasy, výsledky i volno — bez vyhoření." },
  { Icon: Handshake, t: "Sparring", d: "Najdi, s kým si zahrát, podle úrovně a okolí." },
  { Icon: MessagesSquare, t: "Poradna a komunita", d: "Zeptej se zkušených rodičů i odborníků." },
  { Icon: BookOpen, t: "Knihovna a návody", d: "Články a rady pro rodiče malých tenistů." },
  { Icon: Trophy, t: "Turnaje a kalendář", d: "Přehled turnajů a plán celé sezóny." },
];

const PKGS = [
  { Icon: Flame, t: "BOOST", d: "Dočasná TOP pozice — tvůj pin i profil výš a zvýrazněný, ať tě víc lidí najde.", },
  { Icon: Gamepad2, t: "Herní strom dovedností", d: "Gamifikace pokroku dětí: strom dovedností, odznaky a levely. Trénink a růst zábavnější — děti chtějí víc.", },
];

export function CenaClenstvi({ member = false }: { member?: boolean }) {
  return (
    <section className="sec cena-sec" id="cena">
      <div className="wrap">
        <span className="cena-eyebrow">Členství pro rodiče</span>
        <h2 className="cena-h">Celý tenisový klub <span className="g">za cenu jedné kávy měsíčně</span></h2>
        <p className="cena-sub">Jedno členství <b>HUB+</b>. Všechno, co rodič a hráč potřebuje, na jednom místě.</p>

        {/* HUB+ pro rodiče */}
        <div className="cena-hub">
          <div className="cena-hub-top">
            <span className="cena-badge hubp"><Users size={16} /> HUB+</span>
            <div className="cena-price"><b>99 Kč</b><span>/ měsíc</span></div>
          </div>
          <div className="cena-benefits">
            {HUB_BENEFITS.map((b) => (
              <div className="cena-ben" key={b.t}>
                <span className="cena-ben-ic"><b.Icon size={20} /></span>
                <div className="cena-ben-tx"><b>{b.t}</b><span>{b.d}</span></div>
              </div>
            ))}
          </div>
          <div className="cena-hub-foot">
            {member
              ? <Link href="/moje-cesta" className="btn btn-green cena-cta">Máš aktivní — otevřít Moji cestu <ArrowRight size={16} /></Link>
              : <Link href="/pristup" className="btn btn-green cena-cta">Chci HUB+ <ArrowRight size={16} /></Link>}
            <span className="cena-note">Zakládající cena <b>99 Kč napořád</b> (od Nového roku 199). Kdykoli zrušíš.</span>
          </div>
        </div>

        {/* TRENÉŘI — jednorázové balíčky (oranžová) */}
        <div className="cena-trainer">
          <span className="cena-eyebrow orange">Pro trenéry</span>
          <h3 className="cena-th">Profil máš <b>zdarma</b>. Chceš vyniknout? Přidej si balíček.</h3>
          <div className="cena-pkg-grid">
            {PKGS.map((p) => (
              <div className="cena-pkg" key={p.t}>
                <div className="cena-pkg-head">
                  <span className="cena-pkg-ic"><p.Icon size={22} /></span>
                  <b>{p.t}</b>
                  <span className="cena-pkg-tag">jednorázově</span>
                </div>
                <p>{p.d}</p>
                <span className="cena-pkg-soon">Brzy</span>
              </div>
            ))}
          </div>
          <p className="cena-trainer-note">Základ — profil, mapa, svěřenci — je vždy <b>zdarma</b>. Balíčky jsou volitelné a kupují se jednorázově.</p>
        </div>
      </div>
    </section>
  );
}
