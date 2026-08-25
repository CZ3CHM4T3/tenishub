"use client";

// Rodičovský rozcestník (po kliku na fotku „Rodič & dítě" na homepage).
// Model (rozhodnuto s Janem): OBJEVOVÁNÍ ZDARMA, NÁSTROJE V ČLENSTVÍ.
// Nečlen vidí všechny nástroje jako dlaždice s prodejním popisem (co to je / jak pomůže),
// ale zamčené → klik vede na registraci. Člen (canPost) má vše odemčené a proklik funguje.
import Link from "next/link";
import { useMe } from "@/lib/useMe";
import {
  MapPin, MessageSquare, Route, MessageSquareHeart, Handshake, MessagesSquare,
  BookOpen, CalendarDays, Repeat, Car, Lock, ArrowRight, Check, Sparkles,
} from "lucide-react";

// ZDARMA — objevování (magnet, funguje i bez členství)
const FREE = [
  { Icon: MapPin, c: "#2f5d57", t: "Najít trenéra a klub", d: "Prohlédni si trenéry, akademie i kurty na mapě — ceníky, recenze i kontakt. Zdarma a bez registrace.", href: "/mapa" },
  { Icon: MessageSquare, c: "#3b5666", t: "Napsat trenérovi", d: "Zeptej se přímo na volné termíny, ceny nebo přístup k dětem. Zprávy jsou zdarma.", href: "/mapa" },
];

// V ČLENSTVÍ — nástroje (zamčené pro nečlena, prodejní popis)
const TOOLS = [
  { Icon: Route, c: "#7C4DD6", t: "Moje cesta", d: "Celá sezóna dítěte přehledně — kalendář tréninků, turnajů i volna, cíle a statistiky. Konečně vidíš, kam to směřuje, a pohlídáš, ať dítě nevyhoří.", href: "/moje-cesta" },
  { Icon: MessageSquareHeart, c: "#864a59", t: "Poradna", d: "Nejsi si jistá výběrem trenéra, tréninkem nebo zdravím dítěte? Zeptáš se a odborník odpoví do 48 hodin. Klid místo nekonečného googlení.", href: "/poradna" },
  { Icon: Handshake, c: "#8a5640", t: "Sparring", d: "Najdi dítěti parťáka na úrovni — podle věku, lokality i stylu hry. Víc odehraných zápasů = rychlejší růst a víc radosti ze hry.", href: "/sparring" },
  { Icon: MessagesSquare, c: "#2f5d57", t: "Fórum rodičů", d: "Nejsi na to sama. Zkušenosti, tipy a doporučení trenérů od rodičů, kteří jsou o krok dál. Zeptej se na cokoli.", href: "/forum" },
  { Icon: BookOpen, c: "#7c6018", t: "Vědět víc — knihovna", d: "Ověřené návody a články celé, bez zámku: jak vybrat raketu i trenéra, výživa malého sportovce, prevence zranění.", href: "/clanky" },
  { Icon: CalendarDays, c: "#3b5666", t: "Kalendář turnajů", d: "Turnaje ve tvém okolí i s přihláškami na jednom místě. Už nezmeškáš termín ani uzávěrku.", href: "/turnaje" },
  { Icon: Repeat, c: "#8a5640", t: "Bazar vybavení", d: "Rakety, boty a oblečení z druhé ruky mezi rodiči. Děti rostou rychle — ušetři.", href: "/bazar" },
  { Icon: Car, c: "#3b8a5a", t: "Spolujízda", d: "Domluv odvoz na trénink i turnaj s rodiči z klubu. Ušetříš čas, nervy i palivo.", href: "/bazar?tab=spolujizda" },
];

export function RodicHub() {
  const { canPost, ready } = useMe();
  const member = canPost; // aktivní HUB+ nebo admin

  return (
    <div className="rhub">
      {/* ZDARMA */}
      <div className="rhub-sec">
        <span className="rhub-lab rhub-lab-free"><Check size={14} /> Zdarma pro každého</span>
        <div className="rhub-grid rhub-grid-2">
          {FREE.map((f, i) => (
            <Link key={i} href={f.href} className="rhub-card rhub-free">
              <span className="rhub-ic" style={{ background: f.c }}><f.Icon size={20} /></span>
              <div className="rhub-txt"><b>{f.t}</b><span className="rhub-desc">{f.d}</span></div>
              <span className="rhub-go"><ArrowRight size={17} /></span>
            </Link>
          ))}
        </div>
      </div>

      {/* V ČLENSTVÍ */}
      <div className="rhub-sec">
        <span className={`rhub-lab ${member ? "rhub-lab-open" : "rhub-lab-hub"}`}>
          {member ? <><Sparkles size={14} /> Máš HUB+ — vše odemčené</> : <><Lock size={13} /> V členství HUB+ · 99 Kč/měsíc</>}
        </span>
        {!member && ready && (
          <p className="rhub-sell">Tohle rodič jinde neposbírá. Zkus to na měsíc — uvidíš, že litovat nebudeš.</p>
        )}
        <div className="rhub-grid">
          {TOOLS.map((tl, i) => {
            const Inner = (
              <>
                <span className="rhub-ic" style={{ background: tl.c }}><tl.Icon size={20} /></span>
                <div className="rhub-txt"><b>{tl.t}</b><span className="rhub-desc">{tl.d}</span></div>
                <span className={member ? "rhub-go" : "rhub-lock"}>{member ? <ArrowRight size={17} /> : <Lock size={15} />}</span>
              </>
            );
            return member
              ? <Link key={i} href={tl.href} className="rhub-card rhub-open">{Inner}</Link>
              : <Link key={i} href="/pristup" className="rhub-card rhub-locked">{Inner}</Link>;
          })}
        </div>
      </div>

      {/* CTA */}
      {!member && (
        <div className="rhub-cta">
          <div className="rhub-cta-txt">
            <b>Vyzkoušej celý klub na měsíc</b>
            <span>Všechny nástroje výš, jedno členství. <b>99 Kč/měsíc</b>, kdykoli zrušíš — bez závazku.</span>
          </div>
          <Link href="/pristup" className="btn btn-gold rhub-cta-btn">Chci předběžný přístup <ArrowRight size={18} /></Link>
        </div>
      )}
    </div>
  );
}
