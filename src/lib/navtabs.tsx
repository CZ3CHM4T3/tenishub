import { UserRound, Route, School, MessagesSquare, Compass, Package, type LucideIcon } from "lucide-react";

export type SubItem = { label: string; href: string };
export type NavTab = { label: string; href?: string; Icon: LucideIcon; accent?: "map" | "office"; group?: SubItem[] };

// Lišta podle role. Princip (Janův návrh): Profil + Můj klub jako dlaždice,
// zbytek = skupiny služeb v logických kategoriích — vše ovladatelné z lišty, bez složitého proklikávání.
export const ROLE_TABS: Record<string, NavTab[]> = {
  rodic: [
    { label: "Profil", Icon: UserRound, group: [
      { label: "Osobní údaje a role", href: "/ucet?tab=profil" },
      { label: "Členství HUB+", href: "/ucet?tab=clenstvi" },
    ] },
    { label: "Moje cesta", href: "/moje-cesta", Icon: Route },
    { label: "Můj klub", Icon: School, accent: "office", group: [
      { label: "Moje děti a pokrok", href: "/deti" },
      { label: "Napojení na trenéra", href: "/deti" },
    ] },
    { label: "Komunita", Icon: MessagesSquare, group: [
      { label: "Fórum rodičů", href: "/forum" },
      { label: "Poradna", href: "/poradna" },
      { label: "Vědět víc (knihovna)", href: "/clanky" },
      { label: "Bazar", href: "/bazar" },
      { label: "Spolujízda", href: "/spolujizda" },
    ] },
    { label: "Služby a okolí", Icon: Compass, group: [
      { label: "Mapa trenérů a kurtů", href: "/mapa" },
      { label: "Sparring", href: "/sparring" },
      { label: "Kalendář turnajů", href: "/turnaje" },
      { label: "Videorozbor", href: "/videorozbor" },
      { label: "Počasí na týden", href: "/pocasi" },
    ] },
  ],
  trener: [
    { label: "Profil", Icon: UserRound, group: [
      { label: "Osobní údaje a role", href: "/ucet?tab=profil" },
      { label: "Členství", href: "/ucet?tab=clenstvi" },
    ] },
    { label: "Můj klub", href: "/klub", Icon: School, accent: "office" },
    { label: "Komunita", Icon: MessagesSquare, group: [
      { label: "Fórum", href: "/forum" },
      { label: "Poradna", href: "/poradna" },
      { label: "Vědět víc (knihovna)", href: "/clanky" },
    ] },
    { label: "Služby a okolí", Icon: Compass, group: [
      { label: "Mapa", href: "/mapa" },
      { label: "Kalendář turnajů", href: "/turnaje" },
      { label: "Počasí na týden", href: "/pocasi" },
    ] },
  ],
  vyplet: [
    { label: "Profil", Icon: UserRound, group: [
      { label: "Osobní údaje a role", href: "/ucet?tab=profil" },
      { label: "Členství", href: "/ucet?tab=clenstvi" },
    ] },
    { label: "Objednávky", href: "/ucet?tab=profil", Icon: Package },
    { label: "Služby a okolí", Icon: Compass, group: [
      { label: "Mapa", href: "/mapa" },
      { label: "Počasí na týden", href: "/pocasi" },
    ] },
  ],
};

// Aktivní role → sloučené záložky (bez duplicit dle labelu, Mapa-accent jednou na konci).
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
