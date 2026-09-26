import type { Metadata } from "next";
import { RolePage } from "@/components/RolePage";
import { ROLES } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Pro trenéry — buďte vidět, klienti si vás najdou",
  description: "Profil na mapě zdarma, plný profil a rezervace s PROFI+ — nebo si nástroje vyslužte růstem klubu a renomé. Trenéři do konce roku mají základ zdarma.",
};

export default function ProTreneryPage() {
  return <RolePage role={ROLES.trener} back={false} />;
}
