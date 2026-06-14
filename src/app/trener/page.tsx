import type { Metadata } from "next";
import TrenerProfile from "./TrenerProfile";

export const metadata: Metadata = {
  title: "Jiří Novák — tenisový trenér Praha 6",
  description:
    "Ověřený tenisový trenér Jiří Novák (Praha 6). Volné hodiny, ceník, recenze — rezervuj lekci online a zaplať kartou.",
};

export default function TrenerPage() {
  return <TrenerProfile />;
}
