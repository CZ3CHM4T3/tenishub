import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { ServiceMap } from "@/components/ServiceMap";
import { CoJeVCene } from "@/components/CoJeVCene";

export const metadata: Metadata = {
  title: "Členství HUB+ — kompletní tenisový klub",
  description: "Přehled všech rolí a jejich výhod v členství HUB+ (99 Kč/měsíc): konkurenční výhoda pro závodní hráče a klid pro rodiče.",
};

export default function ClenstviPage() {
  return (
    <div className="sluzby-page">
      <SiteHeader />

      <div className="wrap sluzby-wrap">
        <h1 className="rv">Členství HUB+</h1>
        <p className="lead rv d1">Jedno členství, všechny nástroje pro tenisového rodiče. Co je v ceně, vidíš hned níž.</p>

        {/* MALÉ CENOVÉ OKNO */}
        <div className="price-mini rv d1">
          <div className="pm-top">
            <div className="pm-price">
              <span className="pm-old">199 Kč</span>
              <span className="pm-now"><b>99 Kč</b><small>/ měsíc</small></span>
            </div>
            <span className="pm-badge">★ zaváděcí cena pro zakládající členy</span>
          </div>
          <p className="pm-note">Běžně <b>199 Kč/měsíc</b>. Kdo se stane členem <b>do konce roku, drží si 99 Kč/měsíc napořád</b> (dokud členství nepřeruší). Od Nového roku už všichni noví 199 Kč.</p>
          <div className="pm-cta">
            <Link href="/pristup" className="btn btn-gold">Chci předběžný přístup</Link>
            <a href="#cena" className="pm-link">Co je v ceně ↓</a>
          </div>
        </div>

        {/* VŠECHNO V CENĚ — NARÁZ VIDĚT */}
        <div className="rv d1" id="cena"><CoJeVCene /></div>

        <p className="price-rolelead rv d1">A co získáte podle toho, kdo jste:</p>
        <div className="rv d1"><ServiceMap showMap={false} showCards={true} /></div>

        <p className="rp-extra" style={{ marginTop: "2rem" }}>
          Pozn.: <b>Videorozbor a konzultace</b> je samostatná placená služba mimo HUB+. <Link href="/videorozbor">Více →</Link>
        </p>
      </div>
    </div>
  );
}
