import { redirect } from "next/navigation";

// Zjednodušený web — /sluzby je skryté (viz lib/simplify). Přesměrování na rozcestník rolí.
export default function SluzbyPage() {
  redirect("/pro-koho");
}
