import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { ServiceMap } from "@/components/ServiceMap";

export const metadata: Metadata = {
  title: "Členství — co je zdarma a co s HUB+",
  description: "Přehled všech rolí a jejich výhod: co máte na TenisHubu zdarma a co navíc s členstvím HUB+ (200 Kč/měsíc). Objevování a spojení je zdarma, platí se za nástroje.",
};

export default function ClenstviPage() {
  return (
    <div className="sluzby-page">
      <header className="subhdr"><div className="wrap"><div className="bar">
        <Link href="/" className="brand"><Wordmark /></Link>
        <Link href="/" className="back">← Zpět na web</Link>
      </div></div></header>

      <div className="wrap sluzby-wrap">
        <h1 className="rv">Členství</h1>
        <p className="lead rv d1">
          Naše pravidlo je jednoduché: <b>objevit, spojit se a být vidět je zdarma</b> — platí se až za
          nástroje, které šetří čas a přinášejí klienty. Vyberte roli a rozklikněte ji: uvidíte přesně,
          co máte <b>zdarma</b> a co navíc s <b>HUB+</b> (200 Kč/měsíc, kdykoli zrušíte).
        </p>

        <div className="rv d1"><ServiceMap showMap={false} showCards={true} /></div>

        <p className="rp-extra" style={{ marginTop: "2rem" }}>
          Pozn.: <b>Videorozbor a konzultace</b> je samostatná placená služba mimo HUB+. <Link href="/videorozbor">Více →</Link>
        </p>
      </div>
    </div>
  );
}
