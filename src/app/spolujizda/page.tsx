import { redirect } from "next/navigation";

// Spolujízda je zatím deaktivovaná (málo lidí) — přesměrování na bazar.
export default function Page() {
  redirect("/bazar");
}
