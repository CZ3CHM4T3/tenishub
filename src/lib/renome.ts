// Renomé trenéra — jedna osa (4 úrovně). Vydělá se metrikami, nedá se koupit.
// Prahy (dolaďujeme): Ověřený = ověření + 10 rodičů + recenze; Doporučený = 25 + ≥4,5;
// TOP = 40 + ≥4,8 + aktivita.

export type RenomeKey = "neovereny" | "overeny" | "doporuceny" | "top";
export type Renome = { level: 0 | 1 | 2 | 3; key: RenomeKey; label: string };

export type RenomeMetrics = {
  verified: boolean;
  members: number;   // platící HUB+ rodiče přivedení přes zvací odkaz
  rating: number;    // průměrné hodnocení (0–5)
  reviews: number;   // počet recenzí
};

export const RENOME_THRESHOLDS = {
  overeny: { members: 10, reviews: 1 },
  doporuceny: { members: 25, rating: 4.5, reviews: 5 },
  top: { members: 40, rating: 4.8, reviews: 15 },
};

export function renomeLevel(m: RenomeMetrics): Renome {
  const t = RENOME_THRESHOLDS;
  if (m.verified && m.members >= t.top.members && m.rating >= t.top.rating && m.reviews >= t.top.reviews)
    return { level: 3, key: "top", label: "TOP trenér" };
  if (m.verified && m.members >= t.doporuceny.members && m.rating >= t.doporuceny.rating && m.reviews >= t.doporuceny.reviews)
    return { level: 2, key: "doporuceny", label: "Doporučený" };
  if (m.verified && m.members >= t.overeny.members && m.reviews >= t.overeny.reviews)
    return { level: 1, key: "overeny", label: "Ověřený" };
  return { level: 0, key: "neovereny", label: "Neověřený" };
}

// Co chybí do dalšího levelu (pro „cestu k povýšení" v rozhraní trenéra).
export function nextRenomeHint(m: RenomeMetrics): string | null {
  const cur = renomeLevel(m).level;
  const t = RENOME_THRESHOLDS;
  if (cur === 0) {
    if (!m.verified) return "Nech se ověřit (identita + licence) — první krok k důvěře.";
    if (m.members < t.overeny.members) return `Získej ${t.overeny.members - m.members} platících rodičů do klubu na úroveň Ověřený.`;
    return "Získej první recenze na úroveň Ověřený.";
  }
  if (cur === 1) {
    const need: string[] = [];
    if (m.members < t.doporuceny.members) need.push(`${t.doporuceny.members - m.members} rodičů`);
    if (m.rating < t.doporuceny.rating) need.push(`hodnocení ≥ ${t.doporuceny.rating}`);
    if (m.reviews < t.doporuceny.reviews) need.push(`${t.doporuceny.reviews - m.reviews} recenzí`);
    return need.length ? `Na Doporučený zbývá: ${need.join(", ")}.` : null;
  }
  if (cur === 2) {
    const need: string[] = [];
    if (m.members < t.top.members) need.push(`${t.top.members - m.members} rodičů`);
    if (m.rating < t.top.rating) need.push(`hodnocení ≥ ${t.top.rating}`);
    if (m.reviews < t.top.reviews) need.push(`${t.top.reviews - m.reviews} recenzí`);
    return need.length ? `Na TOP trenéra zbývá: ${need.join(", ")}.` : null;
  }
  return null;
}
