import type { Metadata } from "next";
import BazarClient from "./BazarClient";

export const metadata: Metadata = {
  title: "Bazar a spolujízda pro tenisové rodiče | TenisHub",
  description: "Vybavení z druhé ruky (rakety, boty, oblečení) a spolujízda na tréninky i turnaje mezi rodiči.",
};

export default function Page() {
  return <BazarClient />;
}
