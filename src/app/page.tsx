"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import Link from "next/link";
import { IconRun } from "@tabler/icons-react";
import { WhistleIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { CITIES, citySlug } from "@/lib/cities";
import { Wordmark } from "@/components/Wordmark";
import { AuthNav } from "@/components/AuthNav";
import { HeroCarousel } from "@/components/HeroCarousel";
import { VideoNudge } from "@/components/VideoNudge";
import {
  Search, CalendarCheck, CreditCard, ArrowRight, ChevronDown, Check, MapPin, Star,
  Users, Trophy, Handshake, Building2, HeartPulse, Award,
  Dumbbell, GraduationCap, Video, MessageCircle, Lock, type LucideIcon,
} from "lucide-react";

/* ── Persony: srovnání Zdarma vs HUB+ (placené = vše zdarma + navíc) ── */
type IconType = ComponentType<{ size?: number; style?: Record<string, string> }>;
type Persona = {
  key: string; Icon: IconType; label: string; promise: string;
  free: string[]; plus: string[];
};
const PERSONAS: Persona[] = [
  { key: "trener", Icon: WhistleIcon, label: "Trenér", promise: "Víc klientů, míň papírování.",
    free: ["Vizitka v katalogu", "Být k nalezení na mapě", "Veřejné recenze"],
    plus: ["Kalendář a online rezervace", "Platby předem (GoPay)", "Správa klientů a omluvenky", "Ověřený odznak a top pozice", "Články a FAQ návody"] },
  { key: "rodic-hobby", Icon: Users, label: "Rodič hobby hráče", promise: "Najdi, rezervuj, zaplať — a měj klid.",
    free: ["Hledání trenérů, kurtů i fyzio", "Profily a recenze", "Prohlížení sparring nabídek"],
    plus: ["Moje cesta — deník tréninků a volna dítěte", "Rezervace a platby na pár kliků", "Zprávy trenérům", "Přehled dítěte (rozvrh, platby)", "Články a FAQ návody"] },
  { key: "rodic-zavodni", Icon: Trophy, label: "Rodič závodního hráče", promise: "Celá cesta dítěte pod kontrolou.",
    free: ["Hledání špičkových specialistů", "Profily a recenze", "Veřejné žebříčky"],
    plus: ["Moje cesta — kalendář kariéry dítěte", "Profil hráče — výsledky a vývoj", "Plánovač turnajů", "Tréninkový checklist", "Sparring podle výkonnosti"] },
  { key: "hrac-amater", Icon: IconRun, label: "Hráč amatér", promise: "Vždycky s kým a kde hrát.",
    free: ["Mapa kurtů a trenérů", "Prohlížení sparringu", "Veřejné žebříčky"],
    plus: ["Rezervace kurtů a lekcí", "Sparring matchmaking", "Statistiky zápasů", "Ligy a výzvy", "Články a FAQ návody"] },
  { key: "hrac-zavodni", Icon: IconRun, label: "Hráč závodní", promise: "Celý tvůj tenisový tým na jednom místě.",
    free: ["Mapa specialistů", "Veřejné žebříčky", "Prohlížení sparringu"],
    plus: ["Rezervace celého týmu (trenér, fyzio, kondice)", "Profil hráče a statistiky", "Plánovač turnajů", "Video-analýza", "Články a FAQ návody"] },
  { key: "sparring", Icon: Handshake, label: "Sparring partner", promise: "Nabídni se a hraj víc.",
    free: ["Prohlížení nabídek na mapě"],
    plus: ["Vlastní sparring inzerát", "Kontaktovat parťáka", "Matchmaking podle úrovně", "Hodnocení po zápase", "Články a FAQ návody"] },
  { key: "areal", Icon: Building2, label: "Klub / areál", promise: "Plné kurty, míň práce.",
    free: ["Profil areálu na mapě", "Kontakty a otevírací doba"],
    plus: ["Rezervační systém + platby", "Obsaď volný kurt teď", "Statistiky vytíženosti", "Napojení trenérů", "Články a FAQ návody"] },
  { key: "fyzio", Icon: HeartPulse, label: "Fyzioterapeut", promise: "Noví klienti z tenisu, co řeší tělo.",
    free: ["Profil fyzia na mapě", "Veřejné recenze"],
    plus: ["Online objednávky termínů", "Poptávky od hráčů (leady)", "Rehabilitační plány online", "Ověřený odznak", "Články a FAQ návody"] },
  { key: "fitness", Icon: Dumbbell, label: "Fitness trenér", promise: "Kondiční klienti přímo z tenisu.",
    free: ["Profil na mapě", "Veřejné recenze"],
    plus: ["Online objednávky tréninků", "Poptávky od hráčů a rodičů", "Prodej kondičních programů", "Ověřený odznak", "Články a FAQ návody"] },
];

// barva role (sladěná s plástí) — pro barevné odlišení v sekci „Pro koho"
const PERSONA_COLOR: Record<string, { c: string; t: string }> = {
  trener: { c: "#7C4DD6", t: "#EEEDFE" },
  "rodic-hobby": { c: "#7c6018", t: "#F2EAD6" },
  "rodic-zavodni": { c: "#7c6018", t: "#F2EAD6" },
  "hrac-amater": { c: "#3b5666", t: "#E5ECF1" },
  "hrac-zavodni": { c: "#3b5666", t: "#E5ECF1" },
  sparring: { c: "#8a5640", t: "#F2E6DF" },
  areal: { c: "#2f5d57", t: "#E0EBE9" },
  fyzio: { c: "#864a59", t: "#F2E5E9" },
  fitness: { c: "#4a5b86", t: "#E8ECF4" },
};

const KIND_META: Record<string, { label: string; Icon: LucideIcon }> = {
  coach: { label: "Trenér", Icon: Award },
  physio: { label: "Fyzio", Icon: HeartPulse },
  fitness: { label: "Fitness", Icon: Dumbbell },
  academy: { label: "Akademie", Icon: GraduationCap },
};

const TESTIMONIALS = [
  { q: "Konečně najdu trenéra a rezervuju za minutu. Žádné telefonování.", a: "Petra M.", r: "rodič · Praha" },
  { q: "Díky funkci Obsaď kurt teď nám neleží prázdné kurty.", a: "TK Sokol", r: "areál · Dobřichovice" },
  { q: "Sparring partnera na své úrovni jsem našel během chvilky.", a: "Tomáš K.", r: "hráč · Brno" },
  { q: "Míň administrativy, víc klientů. Přesně co jsem potřeboval.", a: "Jiří N.", r: "trenér · Praha" },
];

function Counter({ to, suffix }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / 1600, 1);
          const ea = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(to * ea).toLocaleString("cs-CZ") + (suffix ?? "");
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, suffix]);
  return <span ref={ref}>0{suffix ?? ""}</span>;
}

export default function Home() {
  const [persona, setPersona] = useState(0);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [online, setOnline] = useState(42);
  const [visits, setVisits] = useState(563);
  const [solid, setSolid] = useState(false);
  const [progress, setProgress] = useState(0);
  const [featured, setFeatured] = useState<{ id: string; name: string; kind: string; city: string | null; rating: number | null }[]>([]);
  const [specCount, setSpecCount] = useState(0);
  const [venueCount, setVenueCount] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.body.scrollHeight - innerHeight;
      setProgress(h > 0 ? (scrollY / h) * 100 : 0);
      setSolid(scrollY > 30);
    };
    addEventListener("scroll", onScroll);
    return () => removeEventListener("scroll", onScroll);
  }, []);

  // dropdown menu: zavřít kliknutím mimo
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".nav-item")) setOpenMenu(null);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll(".rv").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // živé statistiky (online + návštěvy)
  useEffect(() => {
    const t1 = setInterval(() => setOnline((o) => Math.max(20, o + (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.3 ? 2 : 1))), 3000);
    const t2 = setInterval(() => setVisits((v) => v + Math.floor(Math.random() * 3) + 1), 4200);
    return () => { [t1, t2].forEach(clearInterval); };
  }, []);

  // reální specialisté pro carousel
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.from("specialists").select("id,name,kind,city,rating").eq("verified", true).limit(12);
      if (data) setFeatured(data as typeof featured);
      const [{ count: sc }, { count: vc }] = await Promise.all([
        supabase.from("specialists").select("*", { count: "exact", head: true }),
        supabase.from("venues").select("*", { count: "exact", head: true }),
      ]);
      if (sc != null) setSpecCount(sc);
      if (vc != null) setVenueCount(vc);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const p = PERSONAS[persona];
  const PIcon = p.Icon;
  const pc = PERSONA_COLOR[p.key];
  const marquee = featured.length ? [...featured, ...featured] : [];

  return (
    <>
      <div className="progress" style={{ width: `${progress}%` }} />

      {/* HEADER */}
      <header className={`site${solid ? " solid" : ""}`}>
        <div className="wrap">
          <div className="bar">
            <Link href="/" className="brand" aria-label="TenisHub">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-gg.png" alt="TenisHub" className="brand-img" />
            </Link>
            <nav className="menu">
              <div className="nav-item">
                <button className={`nav-link${openMenu === "koho" ? " open" : ""}`} type="button" onClick={() => setOpenMenu((m) => (m === "koho" ? null : "koho"))}>Pro koho <ChevronDown size={15} /></button>
                <div className={`drop${openMenu === "koho" ? " open" : ""}`}><div className="drop-inner">
                  <Link className="drop-card" href="/pro-koho"><b>Rodič &amp; dítě</b><span>najít, sledovat, poradit</span></Link>
                  <Link className="drop-card" href="/pro-koho"><b>Hráč</b><span>hraj, zlepšuj se, sparring</span></Link>
                  <Link className="drop-card" href="/pro-koho"><b>Trenér</b><span>klienti &amp; nástroje</span></Link>
                  <Link className="drop-card" href="/pro-koho"><b>Sparring partner</b><span>najdi s kým hrát</span></Link>
                  <Link className="drop-card" href="/pro-koho"><b>Areály &amp; kluby</b><span>obsazenost kurtů</span></Link>
                  <Link className="drop-card" href="/pro-koho"><b>Fyzio</b><span>klienti z tenisu</span></Link>
                  <Link className="drop-card" href="/pro-koho"><b>Fitness</b><span>kondiční příprava</span></Link>
                  <Link className="drop-card" href="/pro-koho"><b>Vyplétač</b><span>servis raket</span></Link>
                </div></div>
              </div>
              <Link className="nav-link" href="/mapa">Hledej</Link>
              <Link className="nav-link" href="/clenstvi">Členství</Link>
              <Link className="nav-link" href="/o-nas">O nás</Link>
            </nav>
            <div className="nav-r">
              <AuthNav />
              <button className="burger" aria-label="Menu">☰</button>
            </div>
          </div>
        </div>
      </header>

      {/* PÁS RECENZÍ (pomalu jede pod lištou) */}
      <div className="testi-strip" aria-label="Recenze členů">
        <div className="testi-track">
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
            <span className="tstrip-item" key={i}>
              <Star size={12} /> „{t.q}" <b>{t.a}</b> · {t.r}
            </span>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <span className="orb orb1" /><span className="orb orb2" /><span className="orb orb3" />
        <div className="wrap">
          <div className="hero-center">
            <HeroCarousel />

            {/* 2 SVĚTY — hlavní volba experience */}
            <div className="worlds rv d3">
              <Link href="#svet-rodic" className="world world-rodic" style={{ backgroundImage: "url(/svet-rodic.png)" }}>
                <span className="world-in">
                  <span className="world-tag">Rodič &amp; dítě</span>
                  <span className="world-sub">Hledám trenéra, hlídám cestu dítěte a chci poradit</span>
                  <span className="world-go">Vstoupit <ArrowRight size={16} /></span>
                </span>
              </Link>
              <Link href="/sluzby" className="world world-sluzby" style={{ backgroundImage: "url(/svet-sluzby.png)" }}>
                <span className="world-in">
                  <span className="world-tag">Služby &amp; profíci</span>
                  <span className="world-sub">Trenér · areál · fyzio · fitness · sparring · vyplétání</span>
                  <span className="world-go">Vstoupit <ArrowRight size={16} /></span>
                </span>
              </Link>
            </div>

            {/* JAK VÁM MŮŽEME POMOCI — naváděcí podpora pro rodiče */}
            <div className="help rv d3">
              <h2 className="help-title">Jak vám můžeme pomoci?</h2>
              <div className="help-opts">
                <Link href="/sluzby" className="help-opt"><span className="help-ic"><Search size={20} /></span><span>Najít trenéra nebo kurt pro dítě</span><ArrowRight size={16} className="help-arr" /></Link>
                <Link href="/videorozbor" className="help-opt"><span className="help-ic"><Video size={20} /></span><span>Dítě ztrácí radost / něco mu nejde</span><ArrowRight size={16} className="help-arr" /></Link>
                <Link href="/prihlaseni?tab=reg" className="help-opt"><span className="help-ic"><CalendarCheck size={20} /></span><span>Sledovat pokrok a plánovat (Moje cesta)</span><ArrowRight size={16} className="help-arr" /></Link>
                <Link href="/sparring" className="help-opt"><span className="help-ic"><Handshake size={20} /></span><span>Najít sparring partnera</span><ArrowRight size={16} className="help-arr" /></Link>
                <a href="mailto:info@tenishub.cz?subject=Dotaz" className="help-opt"><span className="help-ic"><MessageCircle size={20} /></span><span>Mám dotaz — poradíte mi?</span><ArrowRight size={16} className="help-arr" /></a>
              </div>
            </div>
          </div>
        </div>

        {/* statistiky po straně, ať neruší */}
        <div className="hero-stats-side">
          <span className="hss-item"><span className="live-dot" /> {online} online</span>
          <span className="hss-item"><Award size={13} /> <b><Counter to={specCount} /></b> specialistů</span>
          <span className="hss-item"><MapPin size={13} /> <b><Counter to={venueCount} /></b> areálů</span>
          <span className="hss-item"><span className="live-dot" /> {visits.toLocaleString("cs-CZ")} dnes</span>
        </div>
        <div className="scrollcue">SCROLL ↓</div>
      </section>

      {/* RODIČ & DÍTĚ — co je zdarma a co s HUB+ (pod fotkami) */}
      <section className="sec rodic-plan" id="svet-rodic">
        <div className="wrap">
          <span className="eyebrow">Rodič &amp; dítě — vše, co nabízíme</span>
          <h2 className="rodic-plan-h">Co máte zdarma a co s HUB+</h2>
          <div className="rodic-plan-cols">
            <div className="rp-col">
              <div className="rp-col-head"><h3>Zdarma</h3><span className="rp-tag rp-tag-free">navždy</span></div>
              <ul className="rp-list">
                <li><Check size={16} /> Najít trenéra, kurt i fyzio na mapě</li>
                <li><Check size={16} /> Profily, ceníky a recenze</li>
                <li><Check size={16} /> Napsat trenérovi (zprávy)</li>
                <li><Check size={16} /> Sparring zeď — najít parťáka</li>
                <li><Check size={16} /> Veřejné žebříčky a články</li>
              </ul>
              <Link href="/prihlaseni?tab=reg" className="btn btn-out" style={{ width: "100%" }}>Vytvořit účet zdarma</Link>
            </div>
            <div className="rp-col rp-col-hub">
              <div className="rp-col-head"><h3>HUB+</h3><span className="rp-tag rp-tag-hub">200 Kč/měs</span></div>
              <ul className="rp-list rp-list-locked">
                <li><Lock size={15} /> <b>Moje cesta</b> — kalendář kariéry dítěte</li>
                <li><Lock size={15} /> Rezervace a platby na pár kliků</li>
                <li><Lock size={15} /> Připomínky lekcí a plateb</li>
                <li><Lock size={15} /> Profil hráče, výsledky a žebříček</li>
                <li><Lock size={15} /> Plánovač turnajů + tréninkový checklist</li>
                <li><Lock size={15} /> Tréninkový deník a sledování pokroku</li>
                <li><Lock size={15} /> Sparring matchmaking podle výkonnosti</li>
                <li><Lock size={15} /> Knihovna článků a návodů (jak vybrat trenéra, výbavu…)</li>
              </ul>
              <Link href="/ucet" className="btn btn-gold" style={{ width: "100%" }}>Chci HUB+</Link>
            </div>
          </div>
          <p className="rp-extra"><Video size={16} /> <b>Videorozbor a konzultace</b> je samostatná placená služba (mimo HUB+). <Link href="/videorozbor">Zjistit víc →</Link></p>
        </div>
      </section>

      {/* MOJE CESTA — hlavní bod HUB+ pro rodiče */}
      <section className="mcpromo">
        <div className="wrap mcpromo-in">
          <div className="mcpromo-txt">
            <span className="mcpromo-eyebrow">★ Hlavní výhoda HUB+ pro rodiče</span>
            <h2>Moje cesta — celá tenisová cesta dítěte <span className="g">na jednom místě</span></h2>
            <p>Provede hobby i závodního hráče <b>celou sezónou</b>: osa příprava → sezóna → mezisezóna, barevný kalendář (tréninky, turnaje i s výsledky, kondice), cíle a statistiky — a hlavně <b>volno a čas jen pro sebe</b>. Růst krok za krokem, bez vyhoření.</p>
            <div className="mcpromo-cta">
              <Link href="/moje-cesta" className="btn btn-green">Otevřít Moji cestu</Link>
              <Link href="/prihlaseni?tab=reg" className="btn btn-out">Vytvořit účet zdarma</Link>
            </div>
          </div>
          <div className="mcpromo-vis" aria-hidden="true">
            <div className="mcleg"><span style={{ background: "#7C4DD6" }} />Trénink</div>
            <div className="mcleg"><span style={{ background: "#bf9a47" }} />Turnaj</div>
            <div className="mcleg"><span style={{ background: "#3b8a5a" }} />Kompenzace</div>
            <div className="mcleg"><span style={{ background: "#cdd3da" }} />Volno</div>
            <div className="mcgrid">
              {["t","t","x","u","t","r","f","t","x","t","u","f","t","t","r","x","u","t","f","t","x"].map((k, i) => (
                <span key={i} className={`mcd mcd-${k}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE — specialisté z DB */}
      {marquee.length > 0 && (
        <section className="marquee-sec">
          <div className="marquee">
            <div className="marquee-track">
              {marquee.map((s, i) => {
                const m = KIND_META[s.kind] ?? KIND_META.coach;
                const MIcon = m.Icon;
                return (
                  <Link href={`/trener/${s.id}`} className="spec-card" key={i}>
                    <span className="spec-ic"><MIcon size={18} /></span>
                    <div><b>{s.name}</b><span className="spec-meta">{m.label}{s.city ? ` · ${s.city}` : ""}</span></div>
                    <span className="spec-rate"><Star size={13} /> {s.rating ?? "—"}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* PRO KOHO — přesunuto na /clenstvi (na homepage skryto) */}
      {false && (
      <section className="sec who-sec" id="proKoho">
        <div className="wrap">
          <span className="eyebrow rv l">Pro koho</span>
          <h2 className="rv l">Co tím získáš ty?</h2>
          <p className="lead rv l">Vyber, kdo jsi — uvidíš, co ti TenisHub usnadní.</p>

          <div className="persona-tabs rv l d1">
            {PERSONAS.map((pp, i) => {
              const TIcon = pp.Icon;
              const col = PERSONA_COLOR[pp.key];
              const on = i === persona;
              return (
                <button
                  key={pp.key}
                  className={`ptab${on ? " on" : ""}`}
                  onClick={() => setPersona(i)}
                  type="button"
                  style={on ? { background: col.t, color: col.c, borderColor: col.c } : undefined}
                >
                  <TIcon size={16} style={{ color: col.c }} /> {pp.label}
                </button>
              );
            })}
          </div>

          <div className="persona-panel" key={p.key} style={{ borderTop: `3px solid ${pc.c}` }}>
            <div className="persona-promise"><span className="pp-ic" style={{ background: pc.t, color: pc.c }}><PIcon size={22} /></span> <span style={{ color: pc.c }}>{p.promise}</span></div>

            <table className="plan-table">
              <thead>
                <tr>
                  <th />
                  <th>Zdarma</th>
                  <th><span className="th-plus">HUB+</span></th>
                </tr>
              </thead>
              <tbody>
                {p.free.map((f) => (
                  <tr key={f}>
                    <td>{f}</td>
                    <td className="pt-ok"><Check size={16} strokeWidth={3} /></td>
                    <td className="pt-ok pt-gold"><Check size={16} strokeWidth={3} /></td>
                  </tr>
                ))}
                {p.plus.map((f) => (
                  <tr key={f}>
                    <td>{f}</td>
                    <td className="pt-no">—</td>
                    <td className="pt-ok pt-gold"><Check size={16} strokeWidth={3} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="persona-cta">
              <Link href="/prihlaseni?tab=reg" className="btn btn-out">Vytvořit účet zdarma</Link>
              <Link href="/ucet" className="btn btn-gold">Chci HUB+ <ArrowRight className="ic" size={18} /></Link>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* JAK TO FUNGUJE */}
      <section className="sec" id="how">
        <div className="wrap">
          <span className="eyebrow rv">Jak to funguje</span>
          <h2 className="rv">Tři kroky</h2>
          <div className="steps">
            <div className="step rv l d1"><div className="ic-b"><Search /></div><div className="num">01</div><h3>Najdi</h3><p>Trenéra, kurt, fyzio nebo sparring v mapě po celé ČR.</p></div>
            <div className="step rv z d2"><div className="ic-b"><CalendarCheck /></div><div className="num">02</div><h3>Rezervuj</h3><p>Vyber termín a rovnou se přihlas. Žádné SMS.</p></div>
            <div className="step rv r d3"><div className="ic-b"><CreditCard /></div><div className="num">03</div><h3>Zaplať &amp; hraj</h3><p>Zaplať online a hotovo. Vše na jednom místě.</p></div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="sec cta" id="cta">
        <div className="wrap">
          <span className="eyebrow rv" style={{ justifyContent: "center", display: "flex" }}>Pojďme na to</span>
          <h2 className="rv">Přidej se k českému tenisu</h2>
          <p className="rv d1">Vstup zdarma. Prémium pro ty, kdo to myslí vážně.</p>
          <Link href="/mapa" className="btn btn-gold rv d2">Vstoupit zdarma <ArrowRight className="ic" size={18} /></Link>
        </div>
      </section>

      <footer className="site">
        <div className="wrap">
          <div className="grid">
            <div>
              <Wordmark className="wm-lg" />
              <p style={{ maxWidth: 320, fontSize: ".92rem", marginTop: ".9rem" }}>Páteř českého tenisu. Najdi, rezervuj, hraj.</p>
            </div>
            <div><h4>Pro koho</h4><div className="links"><Link href="/pro-koho">Rodič &amp; dítě</Link><Link href="/pro-koho">Trenéři</Link><Link href="/pro-koho">Kluby &amp; areály</Link><Link href="/pro-koho">Fyzio &amp; fitness</Link></div></div>
            <div><h4>TenisHub</h4><div className="links"><Link href="/clenstvi">Členství</Link><Link href="/o-nas">O nás</Link><Link href="/mapa">Hledej na mapě</Link><Link href="/sparring">Sparring</Link><Link href="/soukromi">Soukromí a profily</Link></div></div>
          </div>
          <div className="foot-cities">
            <h4>Tenis ve městech</h4>
            <div className="foot-city-links">
              {CITIES.map((c) => (
                <Link key={c[0]} href={`/tenis/${citySlug(c[0])}`}>{c[0]}</Link>
              ))}
            </div>
          </div>
          <div className="copy"><span>© 2026 TenisHub.cz</span><span>tenishub.cz</span></div>
        </div>
      </footer>

      <VideoNudge side="left" bottom={18} delay={2600} photo="/videorozbor-1.png"
        title="Nebaví vaše dítě tenis?" sub={"Poradíme proč — videorozbor & konzultace →"} />
      <VideoNudge side="right" bottom={108} delay={5200} photo="/videorozbor-2.png"
        title={"Videorozbor & konzultace"} sub={"Placená služba: rozbor techniky, pohybu i hlavy →"} />
    </>
  );
}
