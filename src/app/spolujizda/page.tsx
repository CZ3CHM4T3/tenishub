import type { Metadata } from "next";
import BazarClient from "../bazar/BazarClient";

export const metadata: Metadata = {
  title: "Spolujízda na tréninky a turnaje | TenisHub",
  description: "Domluvte si odvoz dítěte na trénink i turnaj s ostatními rodiči z klubu — ušetříte čas i palivo.",
};

export default function Page() {
  return <BazarClient only="spolujizda" />;
}
