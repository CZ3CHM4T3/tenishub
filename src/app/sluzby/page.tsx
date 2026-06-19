import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { ServicePicker } from "@/components/ServicePicker";
import { MapSearch } from "@/components/MapSearch";

export const metadata: Metadata = {
  title: "Služby a profíci — vyberte, koho hledáte nebo kdo jste",
  description: "Trenér, areál, fyzio, fitness, sparring nebo vyplétání. Vyberte si — najděte specialistu na mapě, nebo se přidejte jako poskytovatel.",
};

export default function SluzbyPage() {
  return (
    <div className="sluzby-page">
      <header className="subhdr"><div className="wrap"><div className="bar">
        <Link href="/" className="brand"><Wordmark /></Link>
        <Link href="/" className="back">← Zpět na web</Link>
      </div></div></header>

      <div className="wrap sluzby-wrap">
        <span className="eyebrow rv">Služby &amp; profíci</span>
        <h1 className="rv d1">Koho hledáte — nebo kdo jste?</h1>
        <p className="lead rv d1">Vyberte si. U každé služby najdete specialistu na mapě, nebo se sami přidáte jako poskytovatel.</p>

        <div className="rv d2"><MapSearch /></div>

        <div className="rv d1"><ServicePicker /></div>

        <Link href="/mapa" className="najdi-card sluzby-najdi rv">
          <span className="najdi-ic"><MapPin size={26} /></span>
          <div className="najdi-txt"><b>Nebo otevřete celou mapu</b><span>Všechny služby kolem vás — podle místa a dojezdu</span></div>
          <span className="najdi-arr"><ArrowRight size={22} /></span>
        </Link>
      </div>
    </div>
  );
}
