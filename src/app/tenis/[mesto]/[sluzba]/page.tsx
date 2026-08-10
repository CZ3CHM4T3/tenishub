import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { CITIES, citySlug, cityFromSlug } from "@/lib/cities";
import { listCity, type SpecRow, type VenueRow } from "@/lib/supabase/data";
import { isHiddenCityService } from "@/lib/simplify";

export const dynamic = "force-dynamic";

// Definice služeb pro lokální SEO (přesně na to, co lidé googlí).
type Svc = {
  slug: string;
  label: string;            // "Tenisový trenér"
  h1: (c: string) => string;
  metaTitle: (c: string) => string;
  metaDesc: (c: string) => string;
  intro: (c: string) => string[];
  faq: (c: string) => [string, string][];
  kinds?: string[];         // filtr specialistů
  venues?: boolean;         // areály místo specialistů
};

const SERVICES: Svc[] = [
  {
    slug: "treneri", label: "Tenisový trenér", kinds: ["coach", "academy"],
    h1: (c) => `Tenisový trenér ${c}`,
    metaTitle: (c) => `Tenisový trenér ${c} — ceny, recenze a rezervace`,
    metaDesc: (c) => `Najdi tenisového trenéra v ${c}. Ověřené profily, ceny, recenze a online rezervace lekce pro děti i dospělé — na TenisHubu.`,
    intro: (c) => [
      `Hledáš tenisového trenéra v ${c}? Na TenisHubu najdeš trenéry a tenisové školy na jednom místě — s cenami, recenzemi a možností se rovnou objednat na lekci.`,
      `Ať už začínáte s dítětem, chcete zlepšit hru nebo se připravit na turnaje, vyber trenéra podle lokality, ceny a hodnocení ostatních rodičů a hráčů.`,
    ],
    faq: (c) => [
      [`Kolik stojí tenisový trenér v ${c}?`, `Cena individuální lekce se obvykle pohybuje kolem 400–800 Kč za hodinu podle zkušeností trenéra a kurtu. Konkrétní ceny vidíš přímo v profilech trenérů.`],
      [`Jak najdu dobrého trenéra pro dítě?`, `Zaměř se na zkušenosti s dětmi, recenze od jiných rodičů a lokalitu. Na TenisHubu filtruješ podle města a hodnocení a napíšeš trenérovi přímo.`],
      [`Můžu si lekci rovnou rezervovat?`, `Ano — u trenérů, kteří si spravují kalendář, si vybereš volný termín a objednáš se online.`],
    ],
  },
  {
    slug: "kurty", label: "Tenisové kurty", venues: true,
    h1: (c) => `Tenisové kurty ${c}`,
    metaTitle: (c) => `Tenisové kurty ${c} — areály, ceny a rezervace`,
    metaDesc: (c) => `Tenisové kurty a areály v ${c}. Kde si zahrát, ceny pronájmu kurtu, krytá i venkovní hřiště a online rezervace — na TenisHubu.`,
    intro: (c) => [
      `Kde si v ${c} zahrát tenis? Tady najdeš tenisové areály a kluby s kurty — venkovní antuku i kryté haly, s kontakty a možností rezervace.`,
      `Vyber areál podle lokality a povrchu, mrkni na vybavení a domluv si kurt. Ceny pronájmu a dostupnost najdeš u jednotlivých areálů.`,
    ],
    faq: (c) => [
      [`Kolik stojí pronájem kurtu v ${c}?`, `Hodina na venkovní antuce vychází zhruba na 200–350 Kč, krytá hala bývá dražší (často 400–700 Kč). Ceny se liší dle areálu a sezóny.`],
      [`Dá se hrát i v zimě?`, `Ano, v krytých halách. V přehledu areálů poznáš, které mají kryté kurty.`],
      [`Jak rezervovat kurt?`, `U areálu najdeš kontakt nebo odkaz na jeho rezervační systém; postupně přidáváme rezervaci přímo na TenisHubu.`],
    ],
  },
  {
    slug: "skoly", label: "Tenisová škola", kinds: ["academy"],
    h1: (c) => `Tenisová škola ${c}`,
    metaTitle: (c) => `Tenisová škola pro děti ${c} — kroužky a nábory`,
    metaDesc: (c) => `Tenisové školy a kroužky pro děti v ${c}. Kde přihlásit dítě na tenis, od kolika let, ceny a kontakty — na TenisHubu.`,
    intro: (c) => [
      `Chcete přihlásit dítě na tenis v ${c}? Tady najdeš tenisové školy a akademie, které berou děti od útlého věku (babytenis, minitenis) až po závodní přípravu.`,
      `Porovnej školy podle lokality a recenzí a domluv si nábor nebo první lekci.`,
    ],
    faq: (c) => [
      [`Od kolika let může dítě začít s tenisem?`, `Babytenis se dá hrát už od 4–5 let, minitenis od 6–7 let. Škola přizpůsobí náčiní i kurt věku dítěte.`],
      [`Kolik stojí tenisová škola?`, `Skupinové kroužky vycházejí levněji než individuální lekce; ceny se liší dle školy — najdeš je v profilech.`],
    ],
  },
  {
    slug: "fyzio", label: "Fyzioterapeut pro tenisty", kinds: ["physio"],
    h1: (c) => `Fyzioterapeut pro tenisty ${c}`,
    metaTitle: (c) => `Fyzioterapeut pro tenisty ${c} — prevence a rehabilitace`,
    metaDesc: (c) => `Sportovní fyzioterapie pro tenisty v ${c}. Prevence a léčba tenisového lokte, ramene a zad, návrat po zranění — najdi specialistu na TenisHubu.`,
    intro: (c) => [
      `Řešíš bolest po tenise nebo se vracíš po zranění? V ${c} najdeš sportovní fyzioterapeuty se zkušeností s tenisty — od tenisového lokte po rameno a záda.`,
      `Vyber specialistu podle lokality a recenzí a domluv se na termínu.`,
    ],
    faq: (c) => [
      [`Pomůže fyzioterapie na tenisový loket?`, `Ano — cílené cvičení, terapie a úprava techniky patří k základu léčby i prevence tenisového lokte.`],
      [`Kdy jít k fyzioterapeutovi?`, `Při přetrvávající bolesti, po zranění nebo preventivně při vyšší zátěži. Čím dřív, tím lépe.`],
    ],
  },
  {
    slug: "kondice", label: "Kondiční trenér pro tenisty", kinds: ["fitness"],
    h1: (c) => `Kondiční trenér pro tenisty ${c}`,
    metaTitle: (c) => `Kondiční trenér pro tenisty ${c} — síla, rychlost, prevence`,
    metaDesc: (c) => `Kondiční příprava pro tenisty v ${c}. Síla, rychlost, obratnost a prevence zranění pro děti i dospělé hráče — najdi trenéra na TenisHubu.`,
    intro: (c) => [
      `Chceš na kurtu vydržet a být rychlejší? Kondiční trenéři v ${c} připraví hráče po fyzické stránce — síla, rychlost, obratnost i prevence zranění.`,
      `Vyber trenéra podle lokality a zkušeností s tenisty a domluv se na spolupráci.`,
    ],
    faq: (c) => [
      [`Od kdy má smysl kondiční příprava?`, `U závodních dětí už od mladšího školního věku (hravou formou), u dospělých kdykoli pro výkon i prevenci.`],
      [`Jak často trénovat kondici?`, `Obvykle 1–3× týdně jako doplněk k tenisu, podle úrovně a cílů hráče.`],
    ],
  },
];

const svcFromSlug = (s: string) => SERVICES.find((x) => x.slug === s) ?? null;

export function generateStaticParams() {
  return CITIES.flatMap((c) => SERVICES.filter((s) => !isHiddenCityService(s.slug)).map((s) => ({ mesto: citySlug(c[0]), sluzba: s.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ mesto: string; sluzba: string }> }): Promise<Metadata> {
  const { mesto, sluzba } = await params;
  const city = cityFromSlug(mesto); const svc = svcFromSlug(sluzba);
  if (!city || !svc) return { title: "Tenis v ČR" };
  const title = svc.metaTitle(city);
  const description = svc.metaDesc(city);
  return { title, description, alternates: { canonical: `/tenis/${mesto}/${sluzba}` }, openGraph: { title, description } };
}

export default async function ServiceCityPage({ params }: { params: Promise<{ mesto: string; sluzba: string }> }) {
  const { mesto, sluzba } = await params;
  const city = cityFromSlug(mesto); const svc = svcFromSlug(sluzba);
  if (!city || !svc || isHiddenCityService(svc.slug)) notFound(); // zjednodušený web

  const { specs, vens } = await listCity(city);
  const items = svc.venues ? vens : specs.filter((s) => svc.kinds!.includes(s.kind));

  const faq = svc.faq(city);
  const ld = [
    {
      "@context": "https://schema.org", "@type": "ItemList", name: `${svc.label} ${city}`,
      numberOfItems: items.length,
      itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: (it as SpecRow | VenueRow).name })),
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];

  const otherCities = CITIES.map((c) => c[0]).filter((n) => n !== city).slice(0, 14);
  const otherSvcs = SERVICES.filter((s) => s.slug !== svc.slug && !isHiddenCityService(s.slug));

  return (
    <div className="legal-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <SiteHeader />

      <div className="wrap legal-wrap">
        <nav className="crumbs"><Link href="/mapa">Tenis</Link> › <Link href={`/tenis/${mesto}`}>{city}</Link> › <span>{svc.label}</span></nav>
        <h1>{svc.h1(city)}</h1>
        {svc.intro(city).map((p, i) => <p key={i} className={i === 0 ? "lead" : undefined}>{p}</p>)}

        {items.length > 0 ? (
          <section className="city-sec">
            <h2>{svc.label} v {city} ({items.length})</h2>
            <div className="city-list">
              {items.map((it) => {
                const href = svc.venues ? `/areal/${(it as VenueRow).id}` : `/trener/${(it as SpecRow).id}`;
                return (
                  <Link key={(it as SpecRow | VenueRow).id} href={href} className="city-row">
                    <span className="city-row-name">{(it as SpecRow | VenueRow).name}</span>
                    <span className="city-row-sub">{svc.venues ? "Areál" : svc.label} →</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : (
          <p style={{ color: "var(--muted)" }}>
            Pro {city} zatím doplňujeme záznamy. Mezitím mrkni na <Link href="/mapa" style={{ color: "var(--gold-l)", fontWeight: 600 }}>celou mapu</Link> nebo na <Link href={`/tenis/${mesto}`} style={{ color: "var(--gold-l)", fontWeight: 600 }}>všechny služby v {city}</Link>.
          </p>
        )}

        <section className="city-sec">
          <h2>Časté dotazy</h2>
          <div className="faq-list">
            {faq.map(([q, a]) => (
              <details className="faq-item" key={q}>
                <summary>{q}</summary>
                <div className="faq-a">{a}</div>
              </details>
            ))}
          </div>
        </section>

        <section className="city-sec">
          <h2>Další v {city}</h2>
          <div className="city-tags">
            {otherSvcs.map((s) => <Link key={s.slug} href={`/tenis/${mesto}/${s.slug}`} className="city-tag">{s.label}</Link>)}
          </div>
        </section>

        <section className="city-sec">
          <h2>{svc.label} v dalších městech</h2>
          <div className="city-tags">
            {otherCities.map((n) => <Link key={n} href={`/tenis/${citySlug(n)}/${svc.slug}`} className="city-tag">{n}</Link>)}
          </div>
        </section>
      </div>
    </div>
  );
}
