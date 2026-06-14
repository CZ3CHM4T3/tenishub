import type { Metadata } from "next";
import TrenerDetailClient from "./TrenerDetailClient";
import TrenerProfile from "../TrenerProfile";
import { getSpecialist, type SpecRow } from "@/lib/supabase/data";

// Server-rendered kvůli SEO (Google vidí obsah). force-dynamic → nefetchuje při buildu
// (lokálně síť blokovaná); na Vercelu načte server-side. Když server fetch selže (lokál),
// spadne zpět na klientské načítání.
export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  coach: "Tenisový trenér", physio: "Fyzioterapeut", fitness: "Kondiční trenér", academy: "Tenisová škola",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const s = await getSpecialist(id);
  if (!s) return { title: "Profil specialisty" };
  const role = KIND_LABEL[s.kind] ?? "Specialista";
  const title = `${s.name} — ${role}${s.city ? ` ${s.city}` : ""}`;
  const description =
    (s.bio && s.bio.slice(0, 155)) ||
    `${role}${s.city ? ` v ${s.city}` : ""} na TenisHubu — profil, kontakt a rezervace tenisových lekcí.`;
  return {
    title,
    description,
    alternates: { canonical: `/trener/${id}` },
    openGraph: { title, description, type: "profile" },
  };
}

function buildJsonLd(s: SpecRow) {
  const role = KIND_LABEL[s.kind] ?? "Specialista";
  const address = s.city ? { "@type": "PostalAddress", addressLocality: s.city, addressCountry: "CZ" } : undefined;
  const url = s.website ? (s.website.startsWith("http") ? s.website : `https://${s.website}`) : undefined;
  const rating =
    s.reviews_count && s.reviews_count > 0 && s.rating
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: s.rating, reviewCount: s.reviews_count } }
      : {};
  if (s.kind === "academy") {
    return {
      "@context": "https://schema.org", "@type": "SportsActivityLocation",
      name: s.name, sport: "Tennis", ...(address ? { address } : {}), ...(url ? { url } : {}), ...rating,
    };
  }
  return {
    "@context": "https://schema.org", "@type": "Person",
    name: s.name, jobTitle: role, knowsAbout: "Tenis",
    ...(address ? { address } : {}), ...(url ? { url } : {}), ...rating,
  };
}

export default async function TrenerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSpecialist(id);
  if (!s) return <TrenerDetailClient id={id} />;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(s)) }} />
      <TrenerProfile spec={s} />
    </>
  );
}
