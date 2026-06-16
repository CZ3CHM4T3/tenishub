import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { ServiceMap } from "@/components/ServiceMap";

export const metadata: Metadata = {
  title: "Služby — trenéři, kurty, fyzio, fitness, sparring i vyplétání",
  description: "Vyberte si službu: tenisový trenér, hráč, sparring, areály, fyzio, fitness nebo vyplétání. Najděte specialistu po celé ČR.",
};

export default function SluzbyPage() {
  return (
    <div className="sluzby-page">
      <header className="subhdr"><div className="wrap"><div className="bar">
        <Link href="/" className="brand"><Wordmark /></Link>
        <Link href="/" className="back">← Zpět na web</Link>
      </div></div></header>

      <div className="wrap sluzby-wrap">
        <h1>Služby &amp; profíci</h1>
        <p className="lead">Vyberte si, co hledáte — rozklikněte kartu a uvidíte, co je zdarma a co navíc s HUB+.</p>

        <Link href="/mapa" className="najdi-card sluzby-najdi">
          <span className="najdi-ic"><MapPin size={26} /></span>
          <div className="najdi-txt"><b>NAJDI na mapě</b><span>Všechny služby kolem vás — podle místa a dojezdu</span></div>
          <span className="najdi-arr"><ArrowRight size={22} /></span>
        </Link>

        <ServiceMap showMap={false} hideKeys={["rodic"]} />
      </div>
    </div>
  );
}
