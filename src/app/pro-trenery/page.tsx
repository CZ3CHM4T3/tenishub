import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import {
  UserPlus, ClipboardList, Send, Users, BadgeCheck, ArrowRight, Check,
  Eye, Heart, Wrench, Wallet, ShieldCheck, Flame, Sparkles, HeartPulse,
  Dumbbell, Building2, Scissors,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Pro trenéry a kluby — buďte vidět rodičům, zdarma",
  description: "TenisHub je místo, kde rodiče hledají trenéry pro své děti. Profil i rozhraní máte zdarma, bez provizí. Pozvěte své rodiče, získejte ověření a odemkněte všechny nástroje.",
};

const STEPS = [
  { Icon: UserPlus, t: "Založte profil zdarma", d: "Registrace je zdarma a nic po vás nechceme. Žádné provize z vaší práce." },
  { Icon: ClipboardList, t: "Vyplňte svoji kartu", d: "Foto, ceník, bio a přístup k dětem. Rodiče uvidí, kdo jste a co nabízíte." },
  { Icon: Send, t: "Pozvěte své rodiče", d: "Máte unikátní odkaz — pošlete ho svým klientům a přihlásí se rovnou k vám do komunity." },
  { Icon: Users, t: "Získejte 10 členů", d: "Až vás 10 rodičů podpoří členstvím, jste pro nás prověřený trenér s reálnou komunitou." },
  { Icon: BadgeCheck, t: "Ověřeno a odemčeno", d: "Dostanete odznak Ověřeno TenisHubem, jste vidět na mapě a odemknou se všechny nástroje." },
];

const BENEFITS = [
  { Icon: Eye, t: "Buďte vidět", d: "Rodiče hledají trenéry na mapě i ve vyhledávání. Ukážeme vás těm správným lidem ve vašem okolí." },
  { Icon: Heart, t: "Rodiče blíž k vám", d: "Profil, recenze a přímé zprávy. Rodič má k vám blíž a snáz se rozhodne právě pro vás." },
  { Icon: Wrench, t: "Nástroje pro práci", d: "Komunita, kalendář, informace pro rodiče — a co nechcete, jednoduše vypnete." },
  { Icon: Wallet, t: "Nulové náklady", d: "Profil i rozhraní zdarma, žádné provize z vašich lekcí. Berete jen to, co vám pomůže." },
  { Icon: ShieldCheck, t: "Důvěra a bezpečí", d: "Ověřené prostředí, kterému rodiče věří. Váš odznak Ověřeno mluví za vás." },
  { Icon: Sparkles, t: "Prostor být sami sebou", d: "Rozhraní si přizpůsobíte — ukazujete to, co dělá vaši práci výjimečnou." },
];

const CONDS = [
  "Jméno a příjmení",
  "Fotka obličeje",
  "Adresa působení",
  "Telefonní číslo",
  "Webové stránky",
  "Alespoň 1 recenze od jiného člověka",
  "Alespoň 10 platících členů (HUB+) ve vaší komunitě",
  "Čestné prohlášení o trenérské licenci",
];

const VISION = [
  { Icon: HeartPulse, t: "Fyzioterapeuti" },
  { Icon: Dumbbell, t: "Fitness trenéři" },
  { Icon: Scissors, t: "Vyplétači" },
  { Icon: Building2, t: "Areály a kluby" },
];

export default function ProTreneryPage() {
  return (
    <div className="ptr-page">
      <SiteHeader />

      {/* HERO */}
      <section className="ptr-hero">
        <div className="wrap">
          <span className="ptr-eyebrow rv">Pro trenéry a kluby</span>
          <h1 className="ptr-h1 rv d1">Pomůžeme rodičům najít <span className="g">právě vás</span></h1>
          <p className="ptr-lead rv d1">TenisHub je místo, kde rodiče hledají trenéry pro své děti. Vy odvádíte skvělou práci — my se postaráme, aby vás našli. Profil i rozhraní máte <b>zdarma a bez provizí</b> z vaší práce.</p>
          <div className="ptr-hero-cta rv d2">
            <Link href="/prihlaseni?tab=reg&role=trener" className="btn btn-gold">Založit profil zdarma <ArrowRight size={18} /></Link>
            <a href="#jak" className="ptr-link">Jak to funguje ↓</a>
          </div>
        </div>
      </section>

      <div className="wrap ptr-wrap">
        {/* JAK TO FUNGUJE */}
        <section id="jak" className="ptr-sec">
          <h2 className="ptr-h2 rv">Jak to funguje</h2>
          <p className="ptr-sub rv">Pět kroků od registrace k plně odemčenému prostředí. Členy si pozvete ze své vlastní základny — nikoho nemusíte shánět.</p>
          <div className="ptr-steps rv d1">
            {STEPS.map((s, i) => (
              <div className="ptr-step" key={i}>
                <span className="ptr-step-n">{i + 1}</span>
                <span className="ptr-step-ic"><s.Icon size={22} /></span>
                <b>{s.t}</b>
                <span>{s.d}</span>
                {i < STEPS.length - 1 && <span className="ptr-step-arr"><ArrowRight size={16} /></span>}
              </div>
            ))}
          </div>
        </section>

        {/* CO V TOM MÁTE */}
        <section className="ptr-sec">
          <h2 className="ptr-h2 rv">Co v tom máte</h2>
          <div className="ptr-ben-grid rv d1">
            {BENEFITS.map((b, i) => (
              <div className="ptr-ben" key={i}>
                <span className="ptr-ben-ic"><b.Icon size={20} /></span>
                <b>{b.t}</b>
                <span>{b.d}</span>
              </div>
            ))}
          </div>
        </section>

        {/* PODMÍNKY OVĚŘENÍ */}
        <section className="ptr-sec">
          <h2 className="ptr-h2 rv">Podmínky ověření</h2>
          <p className="ptr-sub rv">Odznak <b>Ověřeno TenisHubem</b> se nekupuje — ověřujeme ručně. Až splníte tyhle body, otevřeme vám plnou viditelnost i všechny funkce.</p>
          <div className="ptr-conds rv d1">
            {CONDS.map((c, i) => (
              <div className="ptr-cond" key={i}><span className="ptr-cond-ic"><Check size={15} /></span>{c}</div>
            ))}
          </div>
        </section>

        {/* TRENÉRSKÝ BOOST */}
        <section className="ptr-sec">
          <div className="ptr-boost rv d1">
            <div className="ptr-boost-head">
              <span className="ptr-boost-ic"><Flame size={26} /></span>
              <div>
                <span className="ptr-boost-tag">Volitelně · pro náročné</span>
                <h2 className="ptr-boost-h">Trenérský Boost</h2>
              </div>
            </div>
            <p className="ptr-boost-lead">Celé interaktivní prostředí připravené na míru vašemu systému — abyste děti snáz motivovali, udrželi nadšené a dychtivé po hře. Vy se prakticky o nic nestaráte.</p>
            <ul className="ptr-boost-list">
              <li><Check size={15} /> <b>Strom dovedností na míru</b> — nastavíte podle svého systému a máte hotovo</li>
              <li><Check size={15} /> <b>Interní cup</b> — děti soutěží a chtějí hrát víc</li>
              <li><Check size={15} /> <b>Interaktivní prostředí</b> — motivace a přehled na jednom místě</li>
            </ul>
            <div className="ptr-boost-foot">
              <div className="ptr-boost-price"><b>5 000 Kč</b> <span>jednorázově · zakládající cena</span></div>
              <Link href="/prihlaseni?tab=reg&role=trener" className="btn btn-green">Mám zájem o Boost</Link>
            </div>
            <p className="ptr-boost-fine">Zakládající cena platí teď — od Nového roku bude výrazně vyšší. Kdo je u toho dřív, platí míň.</p>
          </div>
        </section>

        {/* PROČ TO DĚLÁME */}
        <section className="ptr-sec">
          <h2 className="ptr-h2 rv">Proč to děláme</h2>
          <p className="ptr-why rv d1">Chceme vytvořit <b>ověřené, bezpečné a kvalitní prostředí</b> pro děti, rodiče i trenéry. Rodič má mít na výběr a jistotu, dítě má mít radost ze hry a vy máte mít prostor ukázat svoji práci.</p>
          <div className="ptr-vision rv d1">
            <span className="ptr-vision-lab">Naše vize — postupně přibývají další odborníci, ať je to full servis:</span>
            <div className="ptr-vision-row">
              {VISION.map((v, i) => (
                <span className="ptr-vision-chip" key={i}><v.Icon size={16} /> {v.t} <em>brzy</em></span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="ptr-final rv d1">
          <h2>Buďte vidět rodičům, kteří vás hledají</h2>
          <p>Založení profilu je zdarma a zabere pár minut.</p>
          <Link href="/prihlaseni?tab=reg&role=trener" className="btn btn-gold ptr-final-btn">Založit profil zdarma <ArrowRight size={18} /></Link>
        </section>
      </div>
    </div>
  );
}
