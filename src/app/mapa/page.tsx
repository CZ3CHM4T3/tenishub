import type { Metadata } from "next";
import MapExplorer from "./MapExplorer";

export const metadata: Metadata = {
  title: "Mapa trenérů, areálů a specialistů",
  description:
    "Najdi na mapě tenisové trenéry, kurty a areály, fitness a kondiční trenéry, fyzioterapeuty, akademie a sparring partnery po celé ČR. Filtruj podle místa a dojezdu.",
};

export default function MapaPage() {
  return <MapExplorer />;
}
