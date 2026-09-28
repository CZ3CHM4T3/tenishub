import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { WhistleIcon } from "@/components/icons";
import { IconRun } from "@tabler/icons-react";
import { Users, Handshake, Building2, HeartPulse, Dumbbell, Grid3x3, Check, Lock, ArrowRight, Search, BadgeCheck, BookOpen, ShieldCheck, Gauge, Heart, CalendarDays, Trophy, MapPin, Star, Zap, type LucideIcon } from "lucide-react";
import { ROLES, ROLE_ORDER, type Role } from "@/lib/roles";
import { isHiddenRole } from "@/lib/simplify";

// ikony pro „proč" karty (klíč z roles.ts → lucide)
const WHY_ICONS: Record<string, LucideIcon> = {
  book: BookOpen, shield: ShieldCheck, gauge: Gauge, heart: Heart, users: Users,
  calendar: CalendarDays, badge: BadgeCheck, trophy: Trophy, handshake: Handshake,
  map: MapPin, star: Star, search: Search, zap: Zap, check: Check,
};

// Jednotná stránka role — VŽDY stejný styl jako /rodic (eyebrow → h1 → lead → „proč" karty →
// cenový pruh → zdarma vs placené → další role). Použito pro /pro-koho i /pro-trenery.
const ICONS: Record<Role["icon"], LucideIcon | typeof WhistleIcon | typeof IconRun> = {
  trener: WhistleIcon, rodic: Users, hrac: IconRun, sparring: Handshake,
  areal: Building2, fyzio: HeartPulse, fitness: Dumbbell, vyplet: Grid3x3,
};
const VISIBLE = ROLE_ORDER.filter((k) => !isHiddenRole(k));

export function RolePage({ role, back = true }: { role: Role; back?: boolean }) {
  const I = ICONS[role.icon];
  // Poskytovatel (trenér atd.) = ZDARMA; funkce rostou s ověřením a renomé (žádná cena PROFI+).
  const priceKc = role.provider ? "zdarma" : "99 Kč/měs";
  const cta = role.provider ? "/pro-trenery" : "/pristup";
  const paidCta = role.provider ? "Chci se ověřit" : "Chci HUB+";
  const why = role.why ?? role.plus.slice(0, 4).map((f) => ({ icon: "check", title: f.label, desc: "" }));

  return (
    <div className="sluzby-page">
      <SiteHeader />
      <div className="wrap sluzby-wrap">
        {back && <Link href="/pro-koho" className="role-back">← Všechny role</Link>}
        <span className="eyebrow rv" style={{ color: role.color }}>{role.label}</span>
        <h1 className="rv d1">{role.provider ? "Buďte vidět — klienti si vás najdou" : "Všechno na jednom místě"}</h1>
        <p className="lead rv d1">{role.tagline.charAt(0).toUpperCase() + role.tagline.slice(1)}. {role.provider
          ? <>Profil i základní nástroje máte <b>zdarma</b>. Ověřením a renomé postupně odemykáte víc možností a funkcí.</>
          : <>Kontakt, nástroje a celý klub odemyká <b>HUB+</b>. Bez něj si web prohlédnete jako ochutnávku.</>}</p>

        {/* PROČ — karty (v barvě role) */}
        <div className="rodic-why rv d1" style={{ ["--rc" as string]: role.color }}>
          <span className="cena-eyebrow">{role.provider ? "Co roste s ověřením a renomé" : "Co získáte s HUB+"}</span>
          <h2>Co pro vás {role.provider ? "jako odborníka" : ""} děláme</h2>
          <div className="rodic-why-grid four">
            {why.map((w, i) => {
              const WI = WHY_ICONS[w.icon] ?? Check;
              return (
                <div className="rodic-why-card" key={i}>
                  <span className="rww-ic" style={{ background: role.fill, color: role.color }}><WI size={20} /></span>
                  <b>{w.title}</b>
                  {w.desc && <span>{w.desc}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* CENOVÝ PRUH */}
        <div className="rodic-price rv d1">
          <div className="rodic-price-in">
            <span className="rodic-price-tag">{role.provider ? "Zdarma" : "Zakládající cena"}</span>
            <div className="rodic-price-txt">
              {role.provider
                ? <><b>Profil i základní nástroje máte zdarma.</b><span>Ověřením (přivedení členové) a renomé rostou možnosti a funkce — podrobný přehled brzy.</span></>
                : <><b>Přidejte se letos = 99 Kč / měsíc napořád.</b><span>Od Nového roku 199 Kč/měs.</span></>}
            </div>
            <Link href={cta} className="btn btn-gold">{paidCta} <ArrowRight size={16} /></Link>
          </div>
        </div>

        {/* ZDARMA vs PLACENÉ */}
        <div className="rodic-plan-cols rv d1" style={{ marginTop: "1.4rem" }}>
          <div className="rp-col">
            <div className="rp-col-head"><h3>Zdarma</h3><span className="rp-tag rp-tag-free">ochutnávka</span></div>
            <ul className="rp-list">
              {role.free.map((f, i) => <li key={i}><Check size={16} /> {f.label}{f.soon && <em className="soon"> brzy</em>}</li>)}
            </ul>
            <Link href={role.find.href} className="btn btn-green" style={{ width: "100%" }}><Search size={16} /> {role.find.label}</Link>
          </div>
          <div className="rp-col rp-col-hub">
            <div className="rp-col-head"><h3>{role.provider ? "S ověřením a renomé" : "HUB+"}</h3><span className="rp-tag rp-tag-hub">{priceKc}</span></div>
            <ul className={`rp-list${role.provider ? "" : " rp-list-locked"}`}>
              {role.plus.map((f, i) => <li key={i}>{role.provider ? <BadgeCheck size={15} /> : <Lock size={15} />} {f.label}{f.soon && <em className="soon"> brzy</em>}</li>)}
              {role.provider && <li><BadgeCheck size={15} /> Vyšší renomé = víc funkcí zdarma</li>}
            </ul>
            <Link href={cta} className="btn btn-gold" style={{ width: "100%" }}>{paidCta}</Link>
          </div>
        </div>

        {/* DALŠÍ ROLE */}
        <div className="role-others rv">
          <span>Jiná role:</span>
          {VISIBLE.filter((k) => k !== role.key).map((k) => (
            <Link key={k} href={k === "trener" ? "/pro-trenery" : k === "rodic" ? "/rodic" : `/pro-koho?role=${k}`} className="role-chip">{ROLES[k].label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
