import type { Metadata } from "next";
import KidClient from "./KidClient";

export const metadata: Metadata = { title: "Kariéra dítěte", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <KidClient id={id} />;
}
