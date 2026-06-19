import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { CITIES, citySlug, cityFromSlug } from "@/lib/cities";
import { listCity, type SpecRow, type VenueRow } from "@/lib/supabase/data";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return CITIES.map((c) => ({ mesto: citySlug(c[0]) }));
}

const KIND_LABEL: Record<string, string> = {
  coach: "Tenisový trenér", academy: "Tenisová škola", physio: "Fyzioterapeut", fitness: "Kondiční trenér",
};

export async function generateMetadata({ params }: { params: Promise<{ mesto: string }> }): Promise<Metadata> {
  const { mesto } = await params;
  const city = cityFromSlug(mesto);
  if (!city) return { title: "Tenis v ČR" };
  const title = `Tenis ${city} — trenéři, kurty, fyzio a akademie`;
  const description = `Tenisoví trenéři, kurty, fyzioterapeuti a akademie v ${city}. Najdi specialistu nebo areál, otevři profil a rezervuj — na TenisHubu.`;
  return { title, description, alternates: { canonical: `/tenis/${mesto}` }, openGraph: { title, description } };
}

function Card({ href, name, sub }: { href: string; name: string; sub: string }) {
  return (
    <Link href={href} className="city-row">
      <span className="city-row-name">{name}</span>
      <span className="city-row-sub">{sub} →</span>
    </Link>
  );
}

export default async function CityPage({ params }: { params: Promise<{ mesto: string }> }) {
  const { mesto } = await params;
  const city = cityFromSlug(mesto);
  if (!city) notFound();

  const { specs, vens } = await listCity(city);
  const coaches = specs.filter((s) => s.kind === "coach" || s.kind === "academy");
  const physio = specs.filter((s) => s.kind === "physio");
  const fitness = specs.filter((s) => s.kind === "fitness");
  const total = specs.length + vens.length;

  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Tenisové služby ${city}`,
    numberOfItems: total,
    itemListElement: [
      ...specs.map((s: SpecRow, i) => ({ "@type": "ListItem", position: i + 1, name: s.name })),
      ...vens.map((v: VenueRow, i) => ({ "@type": "ListItem", position: specs.length + i + 1, name: v.name })),
    ],
  };

  const others = CITIES.map((c) => c[0]).filter((n) => n !== city).slice(0, 12);

  return (
    <div className="legal-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <SiteHeader />

      <div className="wrap legal-wrap">
        <h1>Tenis {city}</h1>
        <p className="lead">
          Tenisoví trenéři, kurty a areály, fyzioterapeuti a kondiční trenéři v {city} na jednom místě.
          Otevři profil, podívej se na kontakt a recenze a domluv si lekci nebo kurt.
        </p>

        {total === 0 ? (
          <p style={{ color: "var(--muted)" }}>
            Pro {city} zatím připravujeme záznamy. Mezitím mrkni na <Link href="/mapa" style={{ color: "var(--gold-l)", fontWeight: 600 }}>celou mapu</Link>.
          </p>
        ) : (
          <>
            {coaches.length > 0 && (
              <section className="city-sec">
                <h2>Trenéři a školy ({coaches.length})</h2>
                <div className="city-list">
                  {coaches.map((s) => <Card key={s.id} href={`/trener/${s.id}`} name={s.name} sub={KIND_LABEL[s.kind] ?? "Specialista"} />)}
                </div>
              </section>
            )}
            {vens.length > 0 && (
              <section className="city-sec">
                <h2>Areály a kurty ({vens.length})</h2>
                <div className="city-list">
                  {vens.map((v) => <Card key={v.id} href={`/areal/${v.id}`} name={v.name} sub="Tenisový areál" />)}
                </div>
              </section>
            )}
            {physio.length > 0 && (
              <section className="city-sec">
                <h2>Fyzioterapie ({physio.length})</h2>
                <div className="city-list">
                  {physio.map((s) => <Card key={s.id} href={`/trener/${s.id}`} name={s.name} sub="Fyzioterapeut" />)}
                </div>
              </section>
            )}
            {fitness.length > 0 && (
              <section className="city-sec">
                <h2>Kondiční trenéři ({fitness.length})</h2>
                <div className="city-list">
                  {fitness.map((s) => <Card key={s.id} href={`/trener/${s.id}`} name={s.name} sub="Kondiční trenér" />)}
                </div>
              </section>
            )}
          </>
        )}

        <section className="city-sec">
          <h2>Tenis v dalších městech</h2>
          <div className="city-tags">
            {others.map((n) => (
              <Link key={n} href={`/tenis/${citySlug(n)}`} className="city-tag">{n}</Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
