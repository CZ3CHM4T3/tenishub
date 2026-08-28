import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Lock, Star, Infinity as InfinityIcon, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Vyzkoušej týden zdarma — zakládající cena 99 Kč napořád",
  description: "Vytvoř si účet a aktivuj týden HUB+ zdarma bez karty. Kdo se přidá letos, drží si zakládající cenu 99 Kč/měsíc natrvalo. Od Nového roku 199 Kč.",
};

export default function PristupPage() {
  return (
    <div className="sluzby-page">
      <SiteHeader />
      <div className="wrap sluzby-wrap" style={{ maxWidth: 720 }}>
        <span className="eyebrow rv"><Star size={14} style={{ verticalAlign: "-2px" }} /> Předběžný přístup</span>
        <h1 className="rv d1">Vyzkoušej to jako <span style={{ color: "var(--gold)" }}>zakládající člen</span></h1>
        <p className="lead rv d1">Vytvoř si účet a aktivuj si <b>týden HUB+ zdarma — bez karty</b>. A hlavně:</p>

        <div className="founder-lock rv d1">
          <div className="fl-row"><span className="fl-ic"><InfinityIcon size={20} /></span><div><b>Zakládající cena 99 Kč/měsíc — napořád</b><span>Kdo se přidá letos, drží si 99 Kč/měsíc natrvalo (dokud členství nepřeruší).</span></div></div>
          <div className="fl-row"><span className="fl-ic"><Lock size={20} /></span><div><b>Od Nového roku 199 Kč/měsíc</b><span>Noví členové po Novém roce už platí běžných 199 Kč. Zakládající cena se neopakuje.</span></div></div>
        </div>

        <div className="wl-card rv d1">
          <h2>Začni týdnem zdarma</h2>
          <p className="member-note">Vytvoř si účet a v sekci Členství si aktivuješ <b>týden zdarma bez karty</b>. Pak pokračuješ za 99 Kč/měsíc (zakládající cena napořád), nebo kdykoli zrušíš.</p>
          <Link href="/prihlaseni?tab=reg" className="btn btn-gold" style={{ width: "100%" }}>Vytvořit účet a začít <ArrowRight size={16} style={{ verticalAlign: "-2px" }} /></Link>
          <Link href="/prihlaseni" className="btn btn-out" style={{ width: "100%", marginTop: ".6rem" }}>Už mám účet — přihlásit se</Link>
        </div>

        <p className="rp-extra rv d1" style={{ marginTop: "1.4rem" }}>
          Chceš zatím vědět, co v členství je? <Link href="/clenstvi">Co je v ceně HUB+ <ArrowRight size={14} style={{ verticalAlign: "-2px" }} /></Link>
        </p>
      </div>
    </div>
  );
}
