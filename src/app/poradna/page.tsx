import type { Metadata } from "next";
import PoradnaClient from "./PoradnaClient";

export const metadata: Metadata = {
  title: "Poradna pro tenisové rodiče — zeptejte se odborníka | TenisHub",
  description: "Nevíte si rady s tréninkem, výběrem trenéra nebo motivací dítěte? Zeptejte se a odpovíme vám na míru.",
};

export default function Page() {
  return <PoradnaClient />;
}
