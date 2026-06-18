import type { Metadata } from "next";
import ForumClient from "./ForumClient";

export const metadata: Metadata = {
  title: "Fórum rodičů — diskuze tenisových rodičů | TenisHub",
  description: "Ptejte se a sdílejte zkušenosti s ostatními tenisovými rodiči: trenéři, turnaje, výbava, kondice i začátky.",
};

export default function Page() {
  return <ForumClient />;
}
