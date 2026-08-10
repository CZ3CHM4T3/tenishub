import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { ShieldCheck, HeartHandshake, Users, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "O nás — online tenisový klub pro rodiče a trenéry",
  description: "TenisHub je péče, podpora, komunita i informace na jednom místě. Pomáháme dětem začít, růst a vydržet u tenisu — pro rodiče, děti a trenéry.",
};

export default function ONasPage() {
  return (
    <div className="legal-page">
      <SiteHeader />

      <section className="vr-hero">
        <div className="wrap">
          <span className="vr-eyebrow rv">O projektu</span>
          <h1 className="rv d1">Pomáháme dětem začít, růst a vydržet u tenisu</h1>
          <p className="vr-lead rv d1">
            Orientovat se v tenise je těžké — kde začít, koho vybrat, co je dobře. TenisHub to dává
            dohromady: <b>péči, podporu, komunitu i informace</b> na jednom místě. Aby každé dítě
            mohlo začít, růst a vydržet u tenisu.
          </p>
        </div>
      </section>

      <div className="wrap legal-wrap">
        <h2 className="rv">Co budujeme</h2>
        <p>
          Ne další katalog. Stavíme <b>ověřenou, pravidelně aktualizovanou síť</b> — tvořenou
          <b> od trenérů, rodičů a hráčů, pro trenéry, rodiče a hráče</b>. Důvěryhodnou komunitu,
          kde se lidé navzájem posouvají a kde má každá role jasnou hodnotu.
        </p>

        <div className="onas-grid rv d1">
          <div className="onas-card"><span className="onas-ic"><ShieldCheck size={22} /></span><b>Ověřeno</b><p>Profily prověřujeme podle recenzí a aktivity. „Ověřeno TenisHubem" znamená důvěru.</p></div>
          <div className="onas-card"><span className="onas-ic"><RefreshCw size={22} /></span><b>Stále aktuální</b><p>Síť žije — data spravují sami trenéři a kluby, doplňujeme je průběžně.</p></div>
          <div className="onas-card"><span className="onas-ic"><Users size={22} /></span><b>Komunita</b><p>Od lidí pro lidi. Rodiče, hráči i profíci na jednom místě, kteří si pomáhají.</p></div>
          <div className="onas-card"><span className="onas-ic"><HeartHandshake size={22} /></span><b>Péče</b><p>Nejen „najdi službu" — provázíme na cestě dítěte a hráče, i lidsky.</p></div>
        </div>

        <h2 className="rv">Jak to děláme</h2>
        <p>
          Všechno hodnotné je součástí členství — jedna cena, kompletní podpora. Za 199 Kč měsíčně
          dáváte dítěti konkurenční výhodu a sobě klid (HUBmember). Tak je to
          férové ke všem stranám.
        </p>
        <p className="vr-foot">
          Máte nápad, zpětnou vazbu, nebo se chcete zapojit? Napište nám na <a href="mailto:info@tenishub.cz">info@tenishub.cz</a>.
        </p>
        <div className="vr-cta">
          <Link href="/pro-koho" className="btn btn-gold">Pro koho je TenisHub</Link>
          <Link href="/clenstvi" className="btn btn-out">Členství &amp; ceny</Link>
        </div>
      </div>
    </div>
  );
}
