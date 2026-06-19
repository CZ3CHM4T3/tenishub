import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import {
  MapPin, Route, Video, Handshake, MessagesSquare, BookOpen, HelpCircle,
  Check, Lock, ArrowRight, Calendar, Repeat, Car,
} from "lucide-react";
import { ROLES } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Rodič & dítě — všechno pro tenisové rodiče na jednom místě",
  description: "Najděte trenéra i kurt, sledujte cestu dítěte, čtěte návody, ptejte se v komunitě rodičů. Vše pro rodiče malých i závodních tenistů.",
};

const QUICK = [
  { Icon: MapPin, t: "Najít trenéra / kurt", s: "specialisté a areály na mapě", href: "/mapa", c: "#7c6018", photo: "/najit-trener.png", badge: "" },
  { Icon: Route, t: "Moje cesta", s: "celá sezóna dítěte přehledně", href: "/moje-cesta", c: "#7C4DD6", photo: "/moje-cesta.png", badge: "HUB+" },
  { Icon: Video, t: "Videorozbor", s: "proč to dítěti nejde — poradíme", href: "/videorozbor", c: "#864a59", photo: "/videorozbor-rodic.png", badge: "Placená služba" },
  { Icon: Handshake, t: "Sparring", s: "najít dítěti parťáka na zápas", href: "/sparring", c: "#8a5640", photo: "/sparring-rodic.png", badge: "HUB+" },
];

const FAQ = [
  { q: "Jak vybrat prvního trenéra pro dítě?", a: "Hledejte podle místa a recenzí na mapě, mrkněte na ceník a přístup k dětem. U ověřených profilů máte jistotu, že subjekt prověřil TenisHub. Klidně napište víc trenérům — psaní zpráv je zdarma." },
  { q: "Od kolika let má smysl začít?", a: "Babytenis a minitenis zvládnou děti už od 4–5 let formou hry. Důležitější než věk je radost a pravidelnost — s tím pomáhá i Moje cesta (hlídá poměr tréninku a volna, aby dítě nevyhořelo)." },
  { q: "Kolikrát týdně trénovat?", a: "Hobby stačí 1–2× týdně, u závodního se objem zvyšuje postupně podle fáze sezóny. V Moji cestě vidíte křivku zátěže, ať to nepřeženete." },
  { q: "Co když dítě začíná ztrácet radost?", a: "Je to častější, než si rodiče myslí — většinou za tím není talent, ale frustrace. Pomůže nezávislý videorozbor a konzultace: objektivně řekneme, v čem je problém a jak dál." },
  { q: "Jak sledovat pokrok a výsledky?", a: "Moje cesta vede celou sezónu: kalendář tréninků a turnajů, cíle, statistiky a u závodních i automatické tažení žebříčku a termínů zápasů ze svazu." },
];

export default function RodicPage() {
  const r = ROLES.rodic;
  return (
    <div className="sluzby-page">
      <header className="subhdr"><div className="wrap"><div className="bar">
        <Link href="/" className="brand"><Wordmark /></Link>
        <Link href="/" className="back">← Zpět na web</Link>
      </div></div></header>

      <div className="wrap sluzby-wrap">
        <span className="eyebrow rv">Rodič &amp; dítě</span>
        <h1 className="rv d1">Všechno pro tenisové rodiče na jednom místě</h1>
        <p className="lead rv d1">Najděte trenéra i kurt, veďte dítě celou sezónou bez vyhoření, čtěte návody a sdílejte zkušenosti s ostatními rodiči.</p>

        {/* RYCHLÉ AKCE */}
        <div className="rolepick-grid">
          {QUICK.map((q, i) => (
            <Link key={i} href={q.href} className={`rolepick rv z d${Math.min(i + 1, 4)}`} style={{ backgroundColor: q.c, backgroundImage: `url(${q.photo})` }}>
              <span className="rolepick-ic" style={{ color: q.c }}><q.Icon size={22} /></span>
              <span className="rolepick-txt"><b>{q.t}{q.badge && <span className={`hm-badge${q.badge === "HUB+" ? "" : " paid"}`}>{q.badge}</span>}</b><span>{q.s}</span></span>
              <span className="rolepick-arr"><ArrowRight size={18} /></span>
            </Link>
          ))}
        </div>

        {/* KOMUNITA & OBSAH (HUB+) */}
        <h2 className="rodic-plan-h rv" style={{ marginTop: "2.2rem" }}>Komunita a obsah pro rodiče</h2>
        <p className="lead rv" style={{ marginTop: "-0.4rem" }}>Prémiové funkce HUB+ — místo, kde rodiče nejsou na tenis sami.</p>
        <div className="rolepick-grid rv d1">
          <Link href="/forum" className="rolepick" style={{ backgroundColor: "#2f5d57", backgroundImage: "url(/forum-rodice.png)" }}>
            <span className="rolepick-ic" style={{ color: "#2f5d57" }}><MessagesSquare size={22} /></span>
            <span className="rolepick-txt"><b>Diskuzní fórum rodičů <span className="hm-badge">HUB+</span></b><span>zkušenosti, doporučení trenérů</span></span>
            <span className="rolepick-arr"><ArrowRight size={18} /></span>
          </Link>
          <Link href="/clanky" className="rolepick" style={{ backgroundColor: "#7C4DD6", backgroundImage: "url(/knihovna-rodic.png)" }}>
            <span className="rolepick-ic" style={{ color: "#7C4DD6" }}><BookOpen size={22} /></span>
            <span className="rolepick-txt"><b>Knihovna článků a návodů</b><span>jak vybrat trenéra, výbavu, výživa…</span></span>
            <span className="rolepick-arr"><ArrowRight size={18} /></span>
          </Link>
          <Link href="/poradna" className="rolepick" style={{ backgroundColor: "#7c6018", backgroundImage: "url(/poradna.png)" }}>
            <span className="rolepick-ic" style={{ color: "#7c6018" }}><HelpCircle size={22} /></span>
            <span className="rolepick-txt"><b>Poradna — zeptej se odborníka <span className="hm-badge">HUB+</span></b><span>odpovědi na míru vašeho dítěte</span></span>
            <span className="rolepick-arr"><ArrowRight size={18} /></span>
          </Link>
          <Link href="/turnaje" className="rolepick" style={{ backgroundColor: "#3b5666", backgroundImage: "url(/turnaje-rodic.png)" }}>
            <span className="rolepick-ic" style={{ color: "#3b5666" }}><Calendar size={22} /></span>
            <span className="rolepick-txt"><b>Kalendář turnajů v okolí</b><span>přihlášky a termíny na jednom místě</span></span>
            <span className="rolepick-arr"><ArrowRight size={18} /></span>
          </Link>
          <Link href="/bazar" className="rolepick" style={{ backgroundColor: "#8a5640", backgroundImage: "url(/bazar.png)" }}>
            <span className="rolepick-ic" style={{ color: "#8a5640" }}><Repeat size={22} /></span>
            <span className="rolepick-txt"><b>Bazar vybavení <span className="hm-badge">HUB+</span></b><span>rakety, boty, oblečení z druhé ruky</span></span>
            <span className="rolepick-arr"><ArrowRight size={18} /></span>
          </Link>
          <Link href="/bazar?tab=spolujizda" className="rolepick" style={{ backgroundColor: "#3b8a5a", backgroundImage: "url(/spolujizda.png)" }}>
            <span className="rolepick-ic" style={{ color: "#3b8a5a" }}><Car size={22} /></span>
            <span className="rolepick-txt"><b>Spolujízda <span className="hm-badge">HUB+</span></b><span>odvoz na trénink i turnaj</span></span>
            <span className="rolepick-arr"><ArrowRight size={18} /></span>
          </Link>
        </div>

        {/* ZDARMA vs HUB+ */}
        <h2 className="rodic-plan-h rv" style={{ marginTop: "2.2rem" }}>Co máte zdarma a co s HUB+</h2>
        <div className="rodic-plan-cols">
          <div className="rp-col rv l d1">
            <div className="rp-col-head"><h3>Zdarma</h3><span className="rp-tag rp-tag-free">navždy</span></div>
            <ul className="rp-list">{r.free.map((f, i) => <li key={i}><Check size={16} /> {f.label}</li>)}</ul>
            <Link href="/prihlaseni?tab=reg" className="btn btn-out" style={{ width: "100%" }}>Vytvořit účet zdarma</Link>
          </div>
          <div className="rp-col rp-col-hub rv r d2">
            <div className="rp-col-head"><h3>HUB+</h3><span className="rp-tag rp-tag-hub">200 Kč/měs</span></div>
            <ul className="rp-list rp-list-locked">{r.plus.map((f, i) => <li key={i}><Lock size={15} /> {f.label}</li>)}</ul>
            <Link href="/ucet" className="btn btn-gold" style={{ width: "100%" }}>Chci HUB+</Link>
          </div>
        </div>

        {/* FAQ */}
        <h2 className="rodic-plan-h rv" style={{ marginTop: "2.2rem" }}>Časté otázky rodičů</h2>
        <div className="faq rv d1">
          {FAQ.map((f, i) => (
            <details className="faq-item" key={i}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
