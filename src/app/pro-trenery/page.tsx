import type { Metadata } from "next";
import { RolePage } from "@/components/RolePage";
import { ROLES } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Pro trenéry — buďte vidět, klienti si vás najdou",
  description: "Profil i základní nástroje zdarma. Ověření a další funkce rostou s renomé (přivedení členové a recenze) — nedají se koupit.",
};

export default function ProTreneryPage() {
  return <RolePage role={ROLES.trener} back={false} />;
}
