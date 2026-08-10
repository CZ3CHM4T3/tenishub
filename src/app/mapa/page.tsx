import type { Metadata } from "next";
import MapExplorer from "./MapExplorer";

export const metadata: Metadata = {
  title: "Mapa tenisových trenérů a klubů",
  description:
    "Najdi na mapě tenisové trenéry, kluby, akademie a sparring partnery po celé ČR. Filtruj podle místa a dojezdu.",
};

export default function MapaPage() {
  return <MapExplorer />;
}
