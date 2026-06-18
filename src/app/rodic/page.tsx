import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import {
  MapPin, Route, Video, Handshake, MessagesSquare, BookOpen, HelpCircle,
  Check, Lock, ArrowRight, Calendar, Repeat,
} from "lucide-react";
import { ROLES } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Rodič & dítě — všechno pro tenisové rodiče na jednom místě",
  description: "Najděte trenéra i kurt, sledujte cestu dítěte, čtěte návody, ptejte se v komunitě rodičů. Vše pro rodiče malých i závodních tenistů.",
};

const QUICK = [
  { Icon: MapPin, t: "Najít trenéra / kurt", s: "specialisté a areály na mapě", href: "/mapa", c: "#7c6018", b: "#F2EAD6", hub: false },
  { Icon: Route, t: "Moje cesta", s: "celá sezóna dítěte přehledně", href: "/moje-cesta", c: "#7C4DD6", b: "#EEEDFE", hub: true },
  { Icon: Video, t: "Videorozbor", s: "proč to dítěti nejde — poradíme", href: "/videorozbor", c: "#864a59", b: "#F2E5E9", hub: true },
  { Icon: Handshake, t: "Sparring", s: "najít dítěti parťáka na zápas", href: "/sparring", c: "#8a5640", b: "#F2E6DF", hub: true },
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
        <span className="eyebrow">Rodič &amp; dítě</span>
        <h1>Všechno pro tenisové rodiče na jednom místě</h1>
        <p className="lead">Najděte trenéra i kurt, veďte dítě celou sezónou bez vyhoření, čtěte návody a sdílejte zkušenosti s ostatními rodiči.</p>

        {/* RYCHLÉ AKCE */}
        <div className="prole-grid">
          {QUICK.map((q, i) => (
            <Link key={i} href={q.href} className="prole-card">
              <span className="prole-ic" style={{ background: q.b, color: q.c }}><q.Icon size={24} /></span>
              <span className="prole-txt"><b>{q.t}{q.hub && <span className="hm-badge">HUB+</span>}</b><span>{q.s}</span></span>
              <span className="prole-arr"><ArrowRight size={18} /></span>
            </Link>
          ))}
        </div>

        {/* KOMUNITA & OBSAH (HUB+) */}
        <h2 className="rodic-plan-h" style={{ marginTop: "2.2rem" }}>Komunita a obsah pro rodiče</h2>
        <p className="lead" style={{ marginTop: "-0.4rem" }}>Prémiové funkce HUB+ — místo, kde rodiče nejsou na tenis sami.</p>
        <div className="prole-grid">
          <div className="prole-card rodic-soon">
            <span className="prole-ic" style={{ background: "#E0EBE9", color: "#2f5d57" }}><MessagesSquare size={24} /></span>
            <span className="prole-txt"><b>Diskuzní fórum rodičů <span className="hm-badge">HUB+</span></b><span>zkušenosti, doporučení trenérů, dotazy</span></span>
            <span className="prole-arr soon">brzy</span>
          </div>
          <div className="prole-card rodic-soon">
            <span className="prole-ic" style={{ background: "#EEEDFE", color: "#7C4DD6" }}><BookOpen size={24} /></span>
            <span className="prole-txt"><b>Knihovna článků a návodů <span className="hm-badge">HUB+</span></b><span>jak vybrat trenéra, výbavu, výživa…</span></span>
            <span className="prole-arr soon">brzy</span>
          </div>
          <div className="prole-card rodic-soon">
            <span className="prole-ic" style={{ background: "#F2EAD6", color: "#7c6018" }}><HelpCircle size={24} /></span>
            <span className="prole-txt"><b>Poradna — zeptej se odborníka <span className="hm-badge">HUB+</span></b><span>odpovědi na míru vašeho dítěte</span></span>
            <span className="prole-arr soon">brzy</span>
          </div>
          <div className="prole-card rodic-soon">
            <span className="prole-ic" style={{ background: "#E5ECF1", color: "#3b5666" }}><Calendar size={24} /></span>
            <span className="prole-txt"><b>Kalendář turnajů v okolí <span className="hm-badge">HUB+</span></b><span>přihlášky a termíny na jednom místě</span></span>
            <span className="prole-arr soon">brzy</span>
          </div>
          <div className="prole-card rodic-soon">
            <span className="prole-ic" style={{ background: "#F2E6DF", color: "#8a5640" }}><Repeat size={24} /></span>
            <span className="prole-txt"><b>Bazar a spolujízda <span className="hm-badge">HUB+</span></b><span>vybavení z druhé ruky, odvoz na turnaj</span></span>
            <span className="prole-arr soon">brzy</span>
          </div>
        </div>

        {/* ZDARMA vs HUB+ */}
        <h2 className="rodic-plan-h" style={{ marginTop: "2.2rem" }}>Co máte zdarma a co s HUB+</h2>
        <div className="rodic-plan-cols">
          <div className="rp-col">
            <div className="rp-col-head"><h3>Zdarma</h3><span className="rp-tag rp-tag-free">navždy</span></div>
            <ul className="rp-list">{r.free.map((f, i) => <li key={i}><Check size={16} /> {f.label}</li>)}</ul>
            <Link href="/prihlaseni?tab=reg" className="btn btn-out" style={{ width: "100%" }}>Vytvořit účet zdarma</Link>
          </div>
          <div className="rp-col rp-col-hub">
            <div className="rp-col-head"><h3>HUB+</h3><span className="rp-tag rp-tag-hub">200 Kč/měs</span></div>
            <ul className="rp-list rp-list-locked">{r.plus.map((f, i) => <li key={i}><Lock size={15} /> {f.label}</li>)}</ul>
            <Link href="/ucet" className="btn btn-gold" style={{ width: "100%" }}>Chci HUB+</Link>
          </div>
        </div>

        {/* FAQ */}
        <h2 className="rodic-plan-h" style={{ marginTop: "2.2rem" }}>Časté otázky rodičů</h2>
        <div className="faq">
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
