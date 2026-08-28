import { UserRound, School, MapPin, LayoutGrid, type LucideIcon } from "lucide-react";

export type TabAccent = "profil" | "klub" | "sluzby" | "najdi";
export type SubItem = { label: string; href: string };
export type NavTab = { label: string; href?: string; Icon: LucideIcon; accent: TabAccent; group?: SubItem[] };

// Hlavní záložky nahoře. 4 pevné identity (každá má svou barvu):
//  Profil (zelená) · Můj klub (zlatá) · Služby (fialová) · Najdi = mapa+hledání (modrá).
// „Moje děti" NENÍ v liště — patří dovnitř Profilu (odtud se načítají do všeho).
const PROFIL: NavTab = { label: "Profil", href: "/ucet?tab=profil", Icon: UserRound, accent: "profil" };
const SLUZBY: NavTab = { label: "Služby", href: "/domu", Icon: LayoutGrid, accent: "sluzby" };
const NAJDI: NavTab = { label: "Najdi", href: "/mapa", Icon: MapPin, accent: "najdi" };
const KLUB_TRENER: NavTab = { label: "Můj klub", href: "/klub", Icon: School, accent: "klub" };
const KLUB_RODIC: NavTab = { label: "Můj klub", href: "/deti", Icon: School, accent: "klub" };

export const ROLE_TABS: Record<string, NavTab[]> = {
  // Rodičův „Můj klub" = /deti (klub trenéra dítěte: nástěnka, napojení kódem, pokrok).
  rodic: [PROFIL, KLUB_RODIC, SLUZBY, NAJDI],
  trener: [PROFIL, KLUB_TRENER, SLUZBY, NAJDI],
  vyplet: [PROFIL, SLUZBY, NAJDI],
  // Hráč (dospělý/amatér) — sparring je jedna z jeho funkcí, ne samostatná role.
  hrac: [PROFIL, SLUZBY, NAJDI],
  // alias pro starší účty, které mají v rolích „sparring" (mapuje na totéž co hráč)
  sparring: [PROFIL, SLUZBY, NAJDI],
  fyzio: [PROFIL, SLUZBY, NAJDI],
  fitness: [PROFIL, SLUZBY, NAJDI],
};

// Je záložka aktivní podle aktuální cesty? (jedna identita může pokrývat víc cest)
export function tabActive(accent: TabAccent, pathname: string): boolean {
  if (accent === "profil") return pathname.startsWith("/ucet") || pathname.startsWith("/moje-cesta");
  if (accent === "klub") return pathname.startsWith("/klub") || pathname.startsWith("/deti");
  if (accent === "sluzby") return pathname.startsWith("/domu") || pathname.startsWith("/sluzby") || pathname.startsWith("/pro-koho");
  if (accent === "najdi") return pathname.startsWith("/mapa") || pathname.startsWith("/tenis");
  return false;
}

// Aktivní role → sloučené záložky (bez duplicit dle labelu, pořadí zachováno).
export function tabsForRoles(roles: string[]): NavTab[] {
  const out: NavTab[] = [];
  const seen = new Set<string>();
  for (const r of roles) {
    for (const t of ROLE_TABS[r] ?? []) {
      if (seen.has(t.label)) continue;
      seen.add(t.label);
      out.push(t);
    }
  }
  return out;
}
