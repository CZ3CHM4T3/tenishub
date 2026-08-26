import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { RodicHub } from "@/components/RodicHub";
import { CoachFeed } from "@/components/CoachFeed";
import { ShieldCheck, Heart, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Rodič & dítě — všechno pro tenisové rodiče na jednom místě",
  description: "Najděte trenéra i kurt zdarma, a v členství HUB+ veďte dítě celou sezónou, ptejte se odborníků a sdílejte zkušenosti s ostatními rodiči.",
};

const FAQ = [
  { q: "Jak vybrat prvního trenéra pro dítě?", a: "Hledejte podle místa a recenzí na mapě, mrkněte na ceník a přístup k dětem. U ověřených profilů máte jistotu, že subjekt prověřil TenisHub. S členstvím pak napíšete víc trenérům přímo v aplikaci." },
  { q: "Co všechno je v členství HUB+?", a: "Členství HUB+ (99 Kč/měsíc, zakládající cena napořád) odemyká úplně vše: najít a kontaktovat trenéra i klub na mapě, Moje cesta, poradnu, sparring, komunitu, knihovnu, bazar i spolujízdu. Bez členství si web prohlédnete jako ochutnávku, ale kontakt a nástroje jsou v HUB+." },
  { q: "Od kolika let má smysl začít?", a: "Babytenis a minitenis zvládnou děti už od 4–5 let formou hry. Důležitější než věk je radost a pravidelnost — s tím pomáhá i Moje cesta (hlídá poměr tréninku a volna, aby dítě nevyhořelo)." },
  { q: "Kolikrát týdně trénovat?", a: "Hobby stačí 1–2× týdně, u závodního se objem zvyšuje postupně podle fáze sezóny. V Moji cestě vidíte křivku zátěže, ať to nepřeženete." },
  { q: "Co když dítě začíná ztrácet radost?", a: "Je to častější, než si rodiče myslí — většinou za tím není talent, ale frustrace. Pomůže nezávislý videorozbor a konzultace: objektivně řekneme, v čem je problém a jak dál." },
  { q: "Můžu členství kdykoli zrušit?", a: "Ano. Žádný závazek, žádné skryté platby. Zkus to na měsíc a uvidíš — když ti to nesedne, zrušíš to." },
];

export default function RodicPage() {
  return (
    <div className="sluzby-page">
      <SiteHeader />

      <div className="wrap sluzby-wrap">
        <span className="eyebrow rv">Rodič &amp; dítě</span>
        <h1 className="rv d1">Všechno pro tenisové rodiče na jednom místě</h1>
        <p className="lead rv d1">Najděte trenéra i kurt zdarma. A v členství veďte dítě celou sezónou bez vyhoření, ptejte se odborníků a sdílejte zkušenosti s ostatními rodiči.</p>

        <div className="rv d1"><CoachFeed /></div>
        <div className="rv d1"><RodicHub /></div>

        {/* PROČ TO DĚLÁME */}
        <div className="rodic-why rv d1">
          <h2>Proč TenisHub</h2>
          <div className="rodic-why-grid">
            <div className="rodic-why-card"><span className="rww-ic"><ShieldCheck size={20} /></span><b>Ověřené a bezpečné</b><span>Trenéry i kluby prověřujeme. Pro děti chceme prostředí, kterému se dá věřit.</span></div>
            <div className="rodic-why-card"><span className="rww-ic"><Heart size={20} /></span><b>Aby dítě vydrželo</b><span>Nejde jen o výsledky. Pomáháme udržet radost ze hry a předejít vyhoření.</span></div>
            <div className="rodic-why-card"><span className="rww-ic"><Users size={20} /></span><b>Nejste na to sami</b><span>Komunita rodičů, odborníci a rady na jednom místě — místo bloudění po internetu.</span></div>
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
