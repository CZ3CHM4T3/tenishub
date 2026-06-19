import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Phone, Mail, Video, Compass, ListChecks, HeartHandshake } from "lucide-react";

export const metadata: Metadata = {
  title: "Videorozbor a konzultace — proč to vašemu dítěti nejde",
  description: "Vaše dítě ztrácí radost z tenisu? Většinou za tím není talent, ale frustrace. Nezávisle a objektivně poradíme konkrétní kroky — videorozbor techniky, pohybu i hlavy.",
};

// 🔑 Jane, sem dej reálné telefonní číslo a tlačítko „Zavolejte nám" se samo objeví.
// Dokud je prázdné, ukazuje se jen e-mail (žádné falešné číslo).
const TEL: string = "";

export default function VideorozborPage() {
  return (
    <div className="legal-page">
      <SiteHeader />

      <section className="vr-hero">
        <div className="wrap">
          <span className="vr-eyebrow rv"><Video size={15} /> Videorozbor &amp; konzultace</span>
          <h1 className="rv d1">Nebaví vaše dítě tenis?</h1>
          <p className="vr-lead rv d1">
            Většinou za tím není nedostatek talentu — ale <b>frustrace</b>. Dítě (a často ani rodič)
            <b> neví, proč mu to nejde</b>, a z toho přichází zklamání a chuť skončit. My vám objektivně
            poradíme, v čem je problém a jak ho řešit.
          </p>
          <div className="vr-cta rv d2">
            {TEL && <a href={`tel:${TEL.replace(/\s/g, "")}`} className="btn btn-gold"><Phone size={18} /> Zavolejte nám: {TEL}</a>}
            <a href="mailto:info@tenishub.cz?subject=Videorozbor%20a%20konzultace" className={`btn ${TEL ? "btn-out" : "btn-gold"}`}><Mail size={16} /> Napište nám: info@tenishub.cz</a>
          </div>
          <p className="vr-note rv d2">Nezávisle na tom, kde vaše dítě trénuje — <b>jsme objektivní</b>. Nezajímá nás klub, zajímá nás vaše dítě.</p>
        </div>
      </section>

      <div className="wrap legal-wrap">
        <h2 className="rv">Jak to funguje</h2>
        <div className="vr-steps rv d1">
          <div className="vr-step"><span className="vr-step-ic"><Video size={22} /></span><div><b>1. Pošlete video nebo zavolejte</b><p>Popíšete, co dítě trápí — technika, pohyb, hlava, ztráta radosti.</p></div></div>
          <div className="vr-step"><span className="vr-step-ic"><Compass size={22} /></span><div><b>2. Nezávislý rozbor</b><p>Objektivně se podíváme na příčinu. Nezajímá nás, kde trénuje — díváme se jen na to, co dítěti pomůže.</p></div></div>
          <div className="vr-step"><span className="vr-step-ic"><ListChecks size={22} /></span><div><b>3. Konkrétní kroky</b><p>Řekneme přesně, v čem je problém a co s ním — jak to děláme my a proč to funguje.</p></div></div>
          <div className="vr-step"><span className="vr-step-ic"><HeartHandshake size={22} /></span><div><b>4. Klid a posun</b><p>Dítě i vy konečně víte, proč a kam jdete. Frustrace se mění v plán.</p></div></div>
        </div>

        <h2 className="rv">S čím poradíme</h2>
        <ul className="vr-list rv d1">
          <li><b>Technika</b> — úder, postavení, práce nohou: kde se rodí chyba a jak ji opravit.</li>
          <li><b>Pohyb a tělo</b> — proč to „nejde", i když dítě dře; co může vázat výkon.</li>
          <li><b>Hlava a motivace</b> — tlak, strach z chyby, ztráta radosti, komunikace s trenérem.</li>
          <li><b>Směr</b> — co teď řešit a co ne, aby dítě rostlo bez vyhoření.</li>
        </ul>

        <p className="vr-foot">
          Funguje pro <b>děti i dospělé</b>. Žádné obecné rady z internetu — konkrétní řešení na míru
          od lidí, kteří tenisu i dětem rozumí.
        </p>
        <div className="vr-cta">
          {TEL && <a href={`tel:${TEL.replace(/\s/g, "")}`} className="btn btn-gold"><Phone size={18} /> Zavolejte nám</a>}
          <a href="mailto:info@tenishub.cz?subject=Videorozbor%20a%20konzultace" className={`btn ${TEL ? "btn-out" : "btn-gold"}`}><Mail size={16} /> info@tenishub.cz</a>
        </div>
      </div>
    </div>
  );
}
