import type { Metadata } from "next";
import BazarClient from "./BazarClient";

export const metadata: Metadata = {
  title: "Bazar vybavení pro tenisové rodiče | TenisHub",
  description: "Tenisové vybavení z druhé ruky mezi rodiči — rakety, boty, oblečení a doplňky.",
};

export default function Page() {
  return <BazarClient only="bazar" />;
}
