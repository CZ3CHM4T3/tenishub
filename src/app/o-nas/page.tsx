import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { ShieldCheck, HeartHandshake, Users, RefreshCw, MessagesSquare, HandHeart, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "O nás — kdo stojí za TenisHubem",
  description: "Za TenisHubem stojí Jiří Machek a Jan Schröffel z Tenisové a fitness akademie MS GEM (Dobřichovice, od 2018). Tvoříme prostor pro rodiče, děti a trenéry — informace, podporu a bezpečné, ověřené prostředí.",
};

// Zakladatelé — reálná fakta (viz msgem.cz). Fotky doplníme (photo → /tym-*.jpg).
const FOUNDERS = [
  { initials: "JM", name: "Jiří Machek", role: "Tenis · trenér II. třídy", photo: "",
    bio: "Tenisu i vedení dětí se věnuje roky — jako trenér II. třídy a lyžařský instruktor. V akademii má na starosti tenisovou přípravu od úplných začátků až po závodní hráče." },
  { initials: "JS", name: "Mgr. Jan Schröffel", role: "Kondice · pedagog", photo: "",
    bio: "Aprobovaný pedagog a holistický kondiční trenér. Stará se o všestranný pohybový rozvoj dětí — aby tenis stál na zdravém a silném základu." },
];

const POSELSTVI = [
  { Icon: MessagesSquare, t: "Prostor pro společnou řeč", d: "Vytváříme místo, kde spolu otevřeně mluví rodiče a trenéři. Otázky, zkušenosti i doporučení na jednom místě — ne roztroušené po Facebooku." },
  { Icon: Users, t: "Nejsme samozvaní experti", d: "Sdílíme, co jsme se za roky na kurtu naučili — ale hlavně zveme ke kulatému stolu další trenéry, fyzioterapeuty i rodiče. Nejlepší odpovědi vznikají společně." },
  { Icon: HandHeart, t: "Hlavně odlehčit rodičům", d: "Chceme informovat, podpořit a dát do rukou nástroje, které začátky usnadní — a postavit bezpečné, kvalitní prostředí s ověřenými lidmi. Český tenis je díky práci ČTS na skvělé úrovni; u úplných začátků, malých hráčů a jejich rodičů i trenérů ale chybí podpora a orientace. Tu chceme doplnit." },
];

export default function ONasPage() {
  return (
    <div className="legal-page">
      <SiteHeader />

      <section className="vr-hero">
        <div className="wrap">
          <span className="vr-eyebrow rv">O nás</span>
          <h1 className="rv d1">Za TenisHubem stojí dva lidé z jednoho kurtu</h1>
          <p className="vr-lead rv d1">
            Jsme <b>Jiří a Jan</b> — vedeme <b>Tenisovou a fitness akademii MS GEM</b> v Dobřichovicích
            od roku <b>2018</b>. TenisHub jsme založili z prostého důvodu: začátky v tenise jsou pro
            rodiče i děti zbytečně těžké a osamělé. To chceme změnit.
          </p>
        </div>
      </section>

      <div className="wrap legal-wrap">
        {/* ZAKLADATELÉ */}
        <div className="tym-grid rv d1">
          {FOUNDERS.map((f) => (
            <div className="tym-card" key={f.name}>
              <span className="tym-photo" style={f.photo ? { backgroundImage: `url(${f.photo})` } : undefined}>{!f.photo && f.initials}</span>
              <div className="tym-tx">
                <b>{f.name}</b>
                <span className="tym-role">{f.role}</span>
                <p>{f.bio}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="tym-more">
          Naši filosofii, celý tým i výsledky (třeba 1. místo v krajském minitenisu nebo 4. místo na MČR)
          najdete na <a href="https://msgem.cz" target="_blank" rel="noopener noreferrer">msgem.cz <ExternalLink size={13} /></a>, Googlu i Instagramu.
        </p>

        {/* POSELSTVÍ */}
        <h2 className="rv">Proč děláme TenisHub</h2>
        <div className="poselstvi rv d1">
          {POSELSTVI.map((p) => (
            <div className="pos-row" key={p.t}>
              <span className="pos-ic"><p.Icon size={22} /></span>
              <div><b>{p.t}</b><p>{p.d}</p></div>
            </div>
          ))}
        </div>

        {/* CO BUDUJEME */}
        <h2 className="rv">Co budujeme</h2>
        <p>
          Ne další katalog. Stavíme <b>ověřenou, pravidelně aktualizovanou síť</b> — tvořenou
          <b> od trenérů, rodičů a hráčů, pro trenéry, rodiče a hráče</b>. Důvěryhodnou komunitu,
          kde se lidé navzájem posouvají a kde má každá role jasnou hodnotu.
        </p>
        <div className="onas-grid rv d1">
          <div className="onas-card"><span className="onas-ic"><ShieldCheck size={22} /></span><b>Ověřeno</b><p>Profily prověřujeme podle recenzí a aktivity. „Ověřeno TenisHubem" znamená důvěru.</p></div>
          <div className="onas-card"><span className="onas-ic"><RefreshCw size={22} /></span><b>Stále aktuální</b><p>Síť žije — data spravují sami trenéři a kluby, doplňujeme je průběžně.</p></div>
          <div className="onas-card"><span className="onas-ic"><Users size={22} /></span><b>Komunita</b><p>Od lidí pro lidi. Rodiče, hráči i odborníci na jednom místě, kteří si pomáhají.</p></div>
          <div className="onas-card"><span className="onas-ic"><HeartHandshake size={22} /></span><b>Péče</b><p>Nejen „najdi službu" — provázíme na cestě dítěte a hráče, i lidsky.</p></div>
        </div>

        <p className="vr-foot">
          Máte nápad, zpětnou vazbu, nebo se chcete zapojit ke kulatému stolu? Napište nám na <a href="mailto:info@tenishub.cz">info@tenishub.cz</a>.
        </p>
        <div className="vr-cta">
          <Link href="/pro-koho" className="btn btn-gold">Pro koho je TenisHub</Link>
          <Link href="/clenstvi" className="btn btn-out">Členství &amp; ceny</Link>
        </div>
      </div>
    </div>
  );
}
