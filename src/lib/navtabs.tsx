import { UserRound, School, LayoutGrid, type LucideIcon } from "lucide-react";

export type TabAccent = "profil" | "klub" | "sluzby";
export type NavTab = { label: string; href: string; Icon: LucideIcon; accent: TabAccent; locked?: boolean };

// ČLENSKÉ patro (vyjede pod outer menu po přihlášení): Profil · Můj klub · Služby.
// „Mapa služeb" NENÍ tady — je v outer menu. „Můj klub" je zatím LOCKED (staví se).
const PROFIL: NavTab = { label: "Profil", href: "/ucet?tab=profil", Icon: UserRound, accent: "profil" };
const SLUZBY: NavTab = { label: "Služby", href: "/sluzby", Icon: LayoutGrid, accent: "sluzby" };
const KLUB_TRENER: NavTab = { label: "Můj klub", href: "/klub", Icon: School, accent: "klub", locked: true };
const KLUB_RODIC: NavTab = { label: "Můj klub", href: "/deti", Icon: School, accent: "klub", locked: true };

// Zatím děláme jen rodiče a trenéra. Ostatní role = základ (Profil + Služby).
export const ROLE_TABS: Record<string, NavTab[]> = {
  rodic: [PROFIL, KLUB_RODIC, SLUZBY],
  trener: [PROFIL, KLUB_TRENER, SLUZBY],
  vyplet: [PROFIL, SLUZBY],
  hrac: [PROFIL, SLUZBY],
  sparring: [PROFIL, SLUZBY],
  fyzio: [PROFIL, SLUZBY],
  fitness: [PROFIL, SLUZBY],
};

// Je členská záložka aktivní podle aktuální cesty?
export function tabActive(accent: TabAccent, pathname: string): boolean {
  if (accent === "profil") return pathname.startsWith("/ucet") || pathname.startsWith("/moje-cesta");
  if (accent === "klub") return pathname.startsWith("/klub") || pathname.startsWith("/deti");
  if (accent === "sluzby") return pathname.startsWith("/sluzby") || pathname.startsWith("/domu");
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
