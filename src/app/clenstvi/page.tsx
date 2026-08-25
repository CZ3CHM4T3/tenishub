import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { ServiceMap } from "@/components/ServiceMap";

export const metadata: Metadata = {
  title: "Členství HUBplus — kompletní tenisový klub",
  description: "Přehled všech rolí a jejich výhod v členství HUBplus (99 Kč/měsíc): konkurenční výhoda pro závodní hráče a klid pro rodiče.",
};

export default function ClenstviPage() {
  return (
    <div className="sluzby-page">
      <SiteHeader />

      <div className="wrap sluzby-wrap">
        <h1 className="rv">Členství</h1>
        <p className="lead rv d1">
          Jedno členství, <b>kompletní podpora</b>. Najít trenéra a připojit dítě do klubu je
          zdarma — <b>HUBplus</b> odemyká rezervace, zprávy, Moje cesta a všechny nástroje.
        </p>

        {/* CENOVÁ SEKCE */}
        <div className="price-card rv d1">
          <span className="price-eyebrow">★ Zakládající cena</span>
          <h2 className="price-name">HUBplus</h2>
          <div className="price-num"><b>99</b> Kč <span>/ měsíc</span></div>
          <p className="price-lock">
            Připoj se teď a máš <b>99 Kč/měsíc zamčených na celý první rok</b>. Po roce se
            členství překlápí na běžnou cenu <b>199 Kč/měsíc</b> — a tuhle cenu už <b>nikdy nezvýšíme</b>. Kdo je členem dřív, platí míň.
          </p>
          <p className="price-guarantee">🔒 Garantujeme: cenu předplatného po prvním roce už nikdy nezvedneme.</p>
          <div className="price-opts">
            <div className="price-opt rec">
              <span className="po-lab">Ročně předem <span className="po-badge">Nejvýhodnější</span></span>
              <span className="po-val">1 188 Kč <small>/ rok</small></span>
              <span className="po-sub">= 99 Kč/měsíc, cena zamčená na rok</span>
            </div>
            <div className="price-opt">
              <span className="po-lab">Měsíčně</span>
              <span className="po-val">99 Kč <small>/ měsíc</small></span>
              <span className="po-sub">Kdykoli zrušíš, žádný závazek</span>
            </div>
          </div>
          <Link href="/prihlaseni?tab=reg" className="btn btn-gold price-cta">Staň se členem</Link>
          <span className="price-fine">Bez skrytých plateb. Členství kdykoli zrušíš. Najít trenéra a sledovat základní pokrok dítěte je zdarma.</span>
        </div>

        <p className="price-rolelead rv d1">Co všechno v členství získáte podle toho, kdo jste:</p>
        <div className="rv d1"><ServiceMap showMap={false} showCards={true} /></div>

        <p className="rp-extra" style={{ marginTop: "2rem" }}>
          Pozn.: <b>Videorozbor a konzultace</b> je samostatná placená služba mimo HUBplus. <Link href="/videorozbor">Více →</Link>
        </p>
      </div>
    </div>
  );
}
