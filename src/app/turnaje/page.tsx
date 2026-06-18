import type { Metadata } from "next";
import TurnajeClient from "./TurnajeClient";

export const metadata: Metadata = {
  title: "Kalendář tenisových turnajů v okolí | TenisHub",
  description: "Přehled nadcházejících tenisových turnajů — termíny, místo, kategorie a odkaz na přihlášku.",
};

export default function Page() {
  return <TurnajeClient />;
}
