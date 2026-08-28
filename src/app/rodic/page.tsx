import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { RodicHub } from "@/components/RodicHub";
import { CoachFeed } from "@/components/CoachFeed";
import Link from "next/link";
import { ShieldCheck, Heart, BookOpen, Gauge, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Rodič & dítě — všechno pro tenisové rodiče na jednom místě",
  description: "V členství HUB+ vedete dítě celou sezónou bez vyhoření, najdete ověřeného trenéra i kurt, ptáte se odborníků a máte komunitu rodičů po ruce.",
};

const FAQ = [
  { q: "Jak vybrat prvního trenéra pro dítě?", a: "Hledejte podle místa a recenzí na mapě, mrkněte na ceník a přístup k dětem. U ověřených profilů máte jistotu, že subjekt prověřil TenisHub. S členstvím pak napíšete víc trenérům přímo v aplikaci." },
  { q: "Co všechno je v členství HUB+?", a: "Členství HUB+ (99 Kč/měsíc, zakládající cena napořád) odemyká úplně vše: najít a kontaktovat trenéra i klub na mapě, Moje cesta, poradnu, sparring, komunitu, knihovnu, bazar i spolujízdu. Bez členství si web prohlédnete jako ochutnávku, ale kontakt a nástroje jsou v HUB+." },
  { q: "Od kolika let má smysl začít?", a: "Babytenis a minitenis zvládnou děti už od 4–5 let formou hry. Důležitější než věk je radost a pravidelnost — s tím pomáhá i Moje cesta (hlídá poměr tréninku a volna, aby dítě nevyhořelo)." },
  { q: "Kolikrát týdně trénovat?", a: "Hobby stačí 1–2× týdně, u závodního se objem zvyšuje postupně podle fáze sezóny. V Moji cestě vidíte křivku zátěže, ať to nepřeženete." },
  { q: "Co když dítě začíná ztrácet radost?", a: "Je to častější, než si rodiče myslí — většinou za tím není talent, ale frustrace. Pomůže nezávislý videorozbor a konzultace: objektivně řekneme, v čem je problém a jak dál." },
  { q: "Můžu členství kdykoli zrušit?", a: "Ano. Žádný závazek, žádné skryté platby. Vyzkoušej týden zdarma (bez karty) a uvidíš — když ti to nesedne, nic neplatíš." },
];

export default function RodicPage() {
  return (
    <div className="sluzby-page">
      <SiteHeader />

      <div className="wrap sluzby-wrap">
        <span className="eyebrow rv">Rodič &amp; dítě</span>
        <h1 className="rv d1">Všechno pro tenisové rodiče na jednom místě</h1>
        <p className="lead rv d1">Chceme vás <b>informovat</b>, vaše dítě <b>chránit</b>, zkvalitnit mu <b>přípravu</b> — a hlavně vám <b>ušetřit stres</b>. Najděte ověřeného trenéra i kurt, veďte dítě celou sezónou bez vyhoření a mějte odborníky i komunitu po ruce. To je členství <b>HUB+</b>.</p>

        <div className="rv d1"><CoachFeed /></div>
        <div className="rv d1"><RodicHub /></div>

        {/* PROČ TO DĚLÁME — rodičovská infografika */}
        <div className="rodic-why rv d1">
          <span className="cena-eyebrow">Proč platíme za HUB+ (a proč to dává smysl)</span>
          <h2>Co pro vás a vaše dítě děláme</h2>
          <div className="rodic-why-grid four">
            <div className="rodic-why-card"><span className="rww-ic"><BookOpen size={20} /></span><b>Informujeme</b><span>Rady odborníků, návody, poradna a kalendář — víte, co a proč, místo bloudění po internetu.</span></div>
            <div className="rodic-why-card"><span className="rww-ic"><ShieldCheck size={20} /></span><b>Chráníme</b><span>Ověření trenéři a kluby. Pro děti chceme prostředí, kterému se dá věřit.</span></div>
            <div className="rodic-why-card"><span className="rww-ic"><Gauge size={20} /></span><b>Zkvalitňujeme přípravu</b><span>Moje cesta hlídá poměr tréninku a volna, výsledky i formu — dítě roste bez přetížení.</span></div>
            <div className="rodic-why-card"><span className="rww-ic"><Heart size={20} /></span><b>Šetříme vám stres</b><span>Najít, rezervovat, poradit se, sledovat pokrok — na pár kliků. Míň starostí, víc klidu.</span></div>
          </div>
          <div className="rodic-why-cta">
            <div><b>To všechno za 99 Kč / měsíc</b><span> — zlomek ceny jediné lekce. Zakládající cena napořád (od Nového roku 199).</span></div>
            <Link href="/pristup" className="btn btn-green">Chci HUB+ <ArrowRight size={16} /></Link>
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
