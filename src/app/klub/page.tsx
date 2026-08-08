import type { Metadata } from "next";
import KlubClient from "./KlubClient";

export const metadata: Metadata = { title: "Můj klub — trenérské rozhraní", robots: { index: false, follow: false } };

export default function Page() {
  return <KlubClient />;
}
