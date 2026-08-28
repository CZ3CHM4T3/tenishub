import { redirect } from "next/navigation";

// /trener (bez id) dřív ukazoval demo profil (smyšlený Jiří Novák) — off-model, veřejně indexovatelné.
// Přesměrováváme na mapu, kde jsou reální trenéři. Konkrétní profil je /trener/[id].
export default function TrenerPage() {
  redirect("/mapa");
}
