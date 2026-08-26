import { Route, Baby, MessagesSquare, Handshake, MapPin, School, Store, Package, type LucideIcon } from "lucide-react";

export type SubItem = { label: string; href: string };
export type NavTab = { label: string; href?: string; Icon: LucideIcon; accent?: "map" | "office"; group?: SubItem[] };

// Záložky podle role. Poskytovatelské role (vyplet…) přidávají „Moje karta".
export const ROLE_TABS: Record<string, NavTab[]> = {
  rodic: [
    { label: "Moje cesta", href: "/moje-cesta", Icon: Route },
    { label: "Děti", href: "/deti", Icon: Baby },
    { label: "Komunita", Icon: MessagesSquare, group: [
      { label: "Fórum rodičů", href: "/forum" },
      { label: "Poradna", href: "/poradna" },
      { label: "Vědět víc (knihovna)", href: "/clanky" },
      { label: "Kalendář turnajů", href: "/turnaje" },
      { label: "Bazar", href: "/bazar" },
      { label: "Spolujízda", href: "/spolujizda" },
      { label: "Videorozbor", href: "/videorozbor" },
    ] },
    { label: "Sparring", href: "/sparring", Icon: Handshake },
    { label: "Mapa", href: "/mapa", Icon: MapPin, accent: "map" },
  ],
  trener: [
    { label: "Můj klub", href: "/klub", Icon: School, accent: "office" },
    { label: "Moje karta", href: "/ucet?tab=karta", Icon: Store },
    { label: "Mapa", href: "/mapa", Icon: MapPin, accent: "map" },
  ],
  vyplet: [
    { label: "Moje karta", href: "/ucet?tab=karta", Icon: Store },
    { label: "Objednávky", href: "/ucet?tab=karta", Icon: Package },
    { label: "Mapa", href: "/mapa", Icon: MapPin, accent: "map" },
  ],
};

// Aktivní role → sloučené záložky (bez duplicit, Mapa jednou na konci).
export function tabsForRoles(roles: string[]): NavTab[] {
  const out: NavTab[] = [];
  const seen = new Set<string>();
  let mapTab: NavTab | null = null;
  for (const r of roles) {
    for (const t of ROLE_TABS[r] ?? []) {
      if (t.accent === "map") { mapTab = t; continue; }
      if (seen.has(t.label)) continue;
      seen.add(t.label);
      out.push(t);
    }
  }
  if (mapTab) out.push(mapTab);
  return out;
}
