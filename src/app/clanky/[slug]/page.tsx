import type { Metadata } from "next";
import ClanekClient from "./ClanekClient";

export const metadata: Metadata = {
  title: "Článek | Knihovna TenisHub",
  description: "Návod a rady pro tenisové rodiče.",
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ClanekClient slug={slug} />;
}
