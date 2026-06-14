import type { Metadata } from "next";
import TrenerDetailClient from "./TrenerDetailClient";

// POZN.: data se načítají na klientu — server-side fetch na Supabase v tomhle prostředí selhává
// („fetch failed" v Next dev serveru; prohlížeč funguje). Po nasazení na Vercel lze překlopit na SSR kvůli SEO.

export const metadata: Metadata = {
  title: "Profil specialisty",
  description: "Profil, volné hodiny a rezervace lekcí.",
};

export default async function TrenerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TrenerDetailClient id={id} />;
}
