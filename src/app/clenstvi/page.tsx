import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { ServiceMap } from "@/components/ServiceMap";

export const metadata: Metadata = {
  title: "Členství HUBmember — kompletní tenisový klub",
  description: "Přehled všech rolí a jejich výhod v členství HUBmember (199 Kč/měsíc): konkurenční výhoda pro závodní hráče a klid pro rodiče.",
};

export default function ClenstviPage() {
  return (
    <div className="sluzby-page">
      <SiteHeader />

      <div className="wrap sluzby-wrap">
        <h1 className="rv">Členství</h1>
        <p className="lead rv d1">
          Naše pravidlo je jednoduché: <b>kompletní podpora v jednom členství</b> — za
          199 Kč měsíčně. Vyberte roli a rozklikněte ji: uvidíte přesně,
          co všechno získáte s <b>HUBmember</b> (199 Kč/měsíc, kdykoli zrušíte).
        </p>

        <div className="rv d1"><ServiceMap showMap={false} showCards={true} /></div>

        <p className="rp-extra" style={{ marginTop: "2rem" }}>
          Pozn.: <b>Videorozbor a konzultace</b> je samostatná placená služba mimo HUBmember. <Link href="/videorozbor">Více →</Link>
        </p>
      </div>
    </div>
  );
}
