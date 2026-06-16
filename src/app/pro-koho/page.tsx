import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { ServiceMap } from "@/components/ServiceMap";

export const metadata: Metadata = {
  title: "Pro koho je TenisHub — rodiče, hráči, trenéři, kluby",
  description: "Vyberte si svou roli: rodič, hráč, trenér, sparring, areál, fyzio, fitness nebo vyplétač. U každé uvidíte, co je zdarma a co navíc s HUB+.",
};

export default function ProKohoPage() {
  return (
    <div className="sluzby-page">
      <header className="subhdr"><div className="wrap"><div className="bar">
        <Link href="/" className="brand"><Wordmark /></Link>
        <Link href="/" className="back">← Zpět na web</Link>
      </div></div></header>

      <div className="wrap sluzby-wrap">
        <h1>Pro koho je TenisHub</h1>
        <p className="lead">Vyberte si roli a rozklikněte ji — uvidíte přesně, co máte <b>zdarma</b> a co navíc s <b>HUB+</b>.</p>
        <ServiceMap showMap={false} showCards={true} />
      </div>
    </div>
  );
}
