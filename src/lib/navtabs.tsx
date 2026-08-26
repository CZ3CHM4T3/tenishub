import { UserRound, Route, School, MapPin, MessagesSquare, Compass, Package, type LucideIcon } from "lucide-react";

export type SubItem = { label: string; href: string };
export type NavTab = { label: string; href?: string; Icon: LucideIcon; accent?: "map" | "office"; group?: SubItem[] };

// Lišta podle role. Profil + Můj klub jako dlaždice, Mapa služeb zvýrazněná (hlavní věc),
// zbytek = skupiny služeb. Vše ovladatelné z lišty, bez složitého proklikávání.
export const ROLE_TABS: Record<string, NavTab[]> = {
  rodic: [
    { label: "Profil", href: "/ucet?tab=profil", Icon: UserRound },
    { label: "Můj klub", Icon: School, accent: "office", group: [
      { label: "Moje děti a pokrok", href: "/deti" },
      { label: "Napojení na trenéra", href: "/deti" },
    ] },
    { label: "Mapa služeb", href: "/mapa", Icon: MapPin, accent: "map" },
    { label: "Komunita", Icon: MessagesSquare, group: [
      { label: "Fórum rodičů", href: "/forum" },
      { label: "Poradna", href: "/poradna" },
      { label: "Knihovna", href: "/clanky" },
      { label: "Bazar", href: "/bazar" },
      { label: "Spolujízda", href: "/spolujizda" },
    ] },
    { label: "Služby a okolí", Icon: Compass, group: [
      { label: "Moje cesta", href: "/moje-cesta" },
      { label: "Sparring", href: "/sparring" },
      { label: "Kalendář turnajů", href: "/turnaje" },
      { label: "Videorozbor", href: "/videorozbor" },
      { label: "Počasí na týden", href: "/pocasi" },
    ] },
  ],
  trener: [
    { label: "Profil", href: "/ucet?tab=profil", Icon: UserRound },
    { label: "Můj klub", href: "/klub", Icon: School, accent: "office" },
    { label: "Mapa služeb", href: "/mapa", Icon: MapPin, accent: "map" },
    { label: "Komunita", Icon: MessagesSquare, group: [
      { label: "Fórum", href: "/forum" },
      { label: "Poradna", href: "/poradna" },
      { label: "Knihovna", href: "/clanky" },
    ] },
    { label: "Služby a okolí", Icon: Compass, group: [
      { label: "Kalendář turnajů", href: "/turnaje" },
      { label: "Počasí na týden", href: "/pocasi" },
    ] },
  ],
  vyplet: [
    { label: "Profil", href: "/ucet?tab=profil", Icon: UserRound },
    { label: "Objednávky", href: "/ucet?tab=profil", Icon: Package },
    { label: "Mapa služeb", href: "/mapa", Icon: MapPin, accent: "map" },
    { label: "Počasí", href: "/pocasi", Icon: Compass },
  ],
};

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
