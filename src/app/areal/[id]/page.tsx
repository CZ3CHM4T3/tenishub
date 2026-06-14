import type { Metadata } from "next";
import ArealDetailClient from "./ArealDetailClient";
import { getVenue } from "@/lib/supabase/data";

// Server-rendered kvůli SEO. force-dynamic (lokálně síť blokovaná → fallback na klienta).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getVenue(id);
  if (!data) return { title: "Tenisový areál" };
  const v = data.venue;
  const title = `${v.name} — tenisový areál${v.city ? ` ${v.city}` : ""}`;
  const description =
    (v.description && v.description.slice(0, 155)) ||
    `Tenisový areál${v.city ? ` ${v.city}` : ""} na TenisHubu — kurty, kontakt a rezervace${data.trainers.length ? `, ${data.trainers.length} trenérů` : ""}.`;
  return {
    title,
    description,
    alternates: { canonical: `/areal/${id}` },
    openGraph: { title, description },
  };
}

export default async function ArealDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getVenue(id);
  if (!data) return <ArealDetailClient id={id} />;
  const v = data.venue;
  const ld = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: v.name,
    sport: "Tennis",
    ...(v.city ? { address: { "@type": "PostalAddress", addressLocality: v.city, addressCountry: "CZ" } } : {}),
    ...(v.website ? { url: v.website.startsWith("http") ? v.website : `https://${v.website}` } : {}),
    ...(v.reviews_count && v.reviews_count > 0 && v.rating
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: v.rating, reviewCount: v.reviews_count } }
      : {}),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <ArealDetailClient id={id} initial={data} />
    </>
  );
}
