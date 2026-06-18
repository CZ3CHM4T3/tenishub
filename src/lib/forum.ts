export const FORUM_CATS: [string, string][] = [
  ["zaciname", "Začínáme s tenisem"],
  ["treneri", "Trenéři a kluby"],
  ["turnaje", "Turnaje a závody"],
  ["vybava", "Výbava a vyplétání"],
  ["zdravi", "Zdraví, kondice, hlava"],
  ["ostatni", "Ostatní"],
];
export const catLabel = (k: string) => FORUM_CATS.find(([v]) => v === k)?.[1] ?? "Ostatní";
