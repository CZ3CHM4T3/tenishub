"use client";

// „Co je v ceně HUB+" — JEDNO místo, kde je naráz vidět všechno, co za 99 Kč/měsíc člen dostane.
// Mřížka (ne slider) = všechno hned vidět. Cena je uvedená jednou nahoře.
import Link from "next/link";
import {
  Route, CalendarCheck, Trophy, LineChart, Handshake, MessageSquareHeart,
  BookOpen, MessagesSquare, CalendarDays, Repeat, Car, Bell, Check, ArrowRight,
} from "lucide-react";

const INCLUDED = [
  { Icon: Route,              c: "#7C4DD6", t: "Moje cesta",            s: "Celá sezóna dítěte přehledně — kalendář, cíle, statistiky." },
  { Icon: CalendarCheck,      c: "#2f5d57", t: "Rezervace a platby",    s: "Objednáte lekci i kurt na pár kliků, platba online." },
  { Icon: Trophy,             c: "#bf9a47", t: "Profil hráče a žebříček", s: "Výsledky a postavení se aktualizují samy." },
  { Icon: LineChart,          c: "#3b5666", t: "Ohlédnutí",            s: "Rozbor zápasů: úspěšnost, dotahování, otočky." },
  { Icon: Handshake,          c: "#8a5640", t: "Sparring",             s: "Parťák na úroveň dítěte podle věku i lokality." },
  { Icon: MessageSquareHeart, c: "#864a59", t: "Poradna",              s: "Nejste si jistí? Odborník odpoví do 48 hodin." },
  { Icon: BookOpen,           c: "#7c6018", t: "Vědět víc",            s: "Knihovna návodů a článků — celé, bez zámku." },
  { Icon: MessagesSquare,     c: "#2f5d57", t: "Fórum rodičů",         s: "Zkušenosti a doporučení trenérů od ostatních." },
  { Icon: CalendarDays,       c: "#3b8a5a", t: "Kalendář turnajů",     s: "Termíny i přihlášky v okolí na jednom místě." },
  { Icon: Repeat,             c: "#8a5640", t: "Bazar vybavení",       s: "Rakety, boty a oblečení z druhé ruky." },
  { Icon: Car,                c: "#3b8a5a", t: "Spolujízda",           s: "Odvoz na trénink i turnaj v rámci komunity." },
  { Icon: Bell,               c: "#7C4DD6", t: "Připomínky",           s: "Upozornění na lekce a platby.", soon: true },
];

export function CoJeVCene() {
  return (
    <section className="cjc">
      <div className="cjc-head">
        <span className="cjc-eyebrow">Vše v jednom členství</span>
        <h2 className="cjc-h">Co je v ceně HUB+</h2>
        <span className="cjc-price"><b>99 Kč</b> / měsíc</span>
        <p className="cjc-sub">Jedno předplatné, všechno níž je součástí. Žádné příplatky, žádný balast.</p>
      </div>

      <div className="cjc-grid">
        {INCLUDED.map((it, i) => (
          <div className="cjc-card" key={i}>
            <span className="cjc-ic" style={{ background: it.c }}><it.Icon size={20} /></span>
            <div className="cjc-txt">
              <b>{it.t}{it.soon && <span className="cjc-soon">brzy</span>}</b>
              <span>{it.s}</span>
            </div>
            <span className="cjc-in"><Check size={14} /></span>
          </div>
        ))}
      </div>

      <div className="cjc-foot">
        <Link href="/pristup" className="btn btn-gold cjc-cta">Chci předběžný přístup <ArrowRight size={18} /></Link>
        <span className="cjc-fine">Členství kdykoli zrušíš. <b>Videorozbor a konzultace</b> je samostatná placená služba mimo členství.</span>
      </div>
    </section>
  );
}
