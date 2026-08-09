// ═══════════════════════════════════════════════════════════════════
// VĚKOVÉ KATEGORIE TENISTŮ — jeden zdroj pravdy pro celý web.
// Definice dle ČTS / Jirky. Kategorie se AUTOMATICKY odvozuje z věku
// (data narození) → dítě se sám posouvá dál, jak stárne.
//
// Pravidlo: kdekoli na webu je výběr věkové kategorie (registrace,
// sparring, filtry, cílení příspěvků, admin…), importuj KATEGORIE
// odsud. Nikde nepiš věkové skupiny natvrdo.
// ═══════════════════════════════════════════════════════════════════
import type { Track } from "./kariera";

export type KategorieKey = "mini" | "baby" | "mladsi" | "starsi" | "dorost" | "dospeli";

export type KategorieDef = {
  k: KategorieKey;
  label: string;   // plný název
  short: string;   // krátký (do štítků / mobilu)
  min: number;     // spodní věk (včetně)
  max: number;     // horní věk (včetně)
  vek: string;     // popisek rozsahu, např. "6–7 let"
};

// Dle Jirky: mini 6–7, baby 8–9, mladší žáci 10–12, starší žáci 13–14,
// dorost 15–18. Dospělí (19+) doplněny, protože web slouží i dospělým hráčům.
export const KATEGORIE: KategorieDef[] = [
  { k: "mini",    label: "Mini",         short: "Mini",     min: 0,  max: 7,   vek: "6–7 let" },
  { k: "baby",    label: "Baby",         short: "Baby",     min: 8,  max: 9,   vek: "8–9 let" },
  { k: "mladsi",  label: "Mladší žáci",  short: "Ml. žáci", min: 10, max: 12,  vek: "10–12 let" },
  { k: "starsi",  label: "Starší žáci",  short: "St. žáci", min: 13, max: 14,  vek: "13–14 let" },
  { k: "dorost",  label: "Dorost",       short: "Dorost",   min: 15, max: 18,  vek: "15–18 let" },
  { k: "dospeli", label: "Dospělí",      short: "Dospělí",  min: 19, max: 200, vek: "19+ let" },
];

// Jen mládežnické kategorie (bez dospělých) — pro dětské / žákovské kontexty.
export const KATEGORIE_MLADEZ = KATEGORIE.filter((c) => c.k !== "dospeli");

const BY_KEY = new Map(KATEGORIE.map((c) => [c.k, c]));

/** Kategorie podle věku v letech (auto-posun dál, jak dítě stárne). */
export function categoryForAge(age: number): KategorieKey {
  if (age <= 7) return "mini";
  if (age <= 9) return "baby";
  if (age <= 12) return "mladsi";
  if (age <= 14) return "starsi";
  if (age <= 18) return "dorost";
  return "dospeli";
}

/** Věk v celých letech z data narození (ISO string). null když nezadáno. */
export function ageFromBirthdate(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const b = new Date(iso);
  if (isNaN(b.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a;
}

/** Kategorie přímo z data narození. null když datum chybí. */
export function categoryForBirthdate(iso: string | null | undefined): KategorieKey | null {
  const a = ageFromBirthdate(iso);
  return a == null ? null : categoryForAge(a);
}

export function categoryDef(k: KategorieKey): KategorieDef {
  return BY_KEY.get(k) ?? KATEGORIE[0];
}
export function categoryLabel(k: KategorieKey): string {
  return categoryDef(k).label;
}

// ── Mapování 6 věkových kategorií → 3 herní tracky (strom dovedností).
// Trenér staví 3 stromy (menší/žáci/dorost+dospělí); dítě dostane strom
// podle své věkové kategorie automaticky.
export const KATEGORIE_TO_TRACK: Record<KategorieKey, Track> = {
  mini: "mini",
  baby: "mini",
  mladsi: "junior",
  starsi: "junior",
  dorost: "adults",
  dospeli: "adults",
};

export function trackForBirthdate(iso: string | null | undefined): Track {
  const cat = categoryForBirthdate(iso);
  return cat ? KATEGORIE_TO_TRACK[cat] : "junior";
}
