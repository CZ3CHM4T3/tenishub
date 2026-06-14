import type { Metadata } from "next";
import ArealDetailClient from "./ArealDetailClient";

// POZN.: data klientsky — server fetch na Supabase v tomhle prostředí selhává (viz /trener/[id]).

export const metadata: Metadata = {
  title: "Tenisový areál",
  description: "Kurty, vybavení a rezervace areálu.",
};

export default async function ArealDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArealDetailClient id={id} />;
}
