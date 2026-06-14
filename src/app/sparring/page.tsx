import type { Metadata } from "next";
import SparringClient from "./SparringClient";

export const metadata: Metadata = {
  title: "Sparring partneři",
  description: "Najdi parťáka na tenis podle úrovně a místa, nebo přidej vlastní inzerát.",
};

export default function SparringPage() {
  return <SparringClient />;
}
