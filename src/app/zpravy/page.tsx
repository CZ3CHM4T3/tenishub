import type { Metadata } from "next";
import ZpravyClient from "./ZpravyClient";

export const metadata: Metadata = { title: "Zprávy", description: "Tvoje konverzace na TenisHubu." };

export default function ZpravyPage() {
  return <ZpravyClient />;
}
