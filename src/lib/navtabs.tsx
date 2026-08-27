import { UserRound, School, MapPin, LayoutGrid, type LucideIcon } from "lucide-react";

export type SubItem = { label: string; href: string };
export type NavTab = { label: string; href?: string; Icon: LucideIcon; accent?: "map" | "office"; group?: SubItem[] };

// Lišta = jen hlavní rozcestníky. Všechny služby jsou v dlaždicích na landing (/domu);
// tlačítko „Služby" vede zpět na tuto landing.
export const ROLE_TABS: Record<string, NavTab[]> = {
  rodic: [
    { label: "Profil", href: "/ucet?tab=profil", Icon: UserRound },
    { label: "Můj klub", Icon: School, accent: "office", group: [
      { label: "Moje děti a pokrok", href: "/deti" },
      { label: "Napojení na trenéra", href: "/deti" },
    ] },
    { label: "Mapa služeb", href: "/mapa", Icon: MapPin, accent: "map" },
    { label: "Služby", href: "/domu", Icon: LayoutGrid },
  ],
  trener: [
    { label: "Profil", href: "/ucet?tab=profil", Icon: UserRound },
    { label: "Můj klub", href: "/klub", Icon: School, accent: "office" },
    { label: "Mapa služeb", href: "/mapa", Icon: MapPin, accent: "map" },
    { label: "Služby", href: "/domu", Icon: LayoutGrid },
  ],
  vyplet: [
    { label: "Profil", href: "/ucet?tab=profil", Icon: UserRound },
    { label: "Mapa služeb", href: "/mapa", Icon: MapPin, accent: "map" },
    { label: "Služby", href: "/domu", Icon: LayoutGrid },
  ],
  sparring: [
    { label: "Profil", href: "/ucet?tab=profil", Icon: UserRound },
    { label: "Mapa služeb", href: "/mapa", Icon: MapPin, accent: "map" },
    { label: "Služby", href: "/domu", Icon: LayoutGrid },
  ],
  fyzio: [
    { label: "Profil", href: "/ucet?tab=profil", Icon: UserRound },
    { label: "Mapa služeb", href: "/mapa", Icon: MapPin, accent: "map" },
    { label: "Služby", href: "/domu", Icon: LayoutGrid },
  ],
  fitness: [
    { label: "Profil", href: "/ucet?tab=profil", Icon: UserRound },
    { label: "Mapa služeb", href: "/mapa", Icon: MapPin, accent: "map" },
    { label: "Služby", href: "/domu", Icon: LayoutGrid },
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
