// Velká česká města jako body pro mapu i vyhledávání.
export const CITIES: [string, number, number][] = [
  ["Praha", 50.0755, 14.4378],
  ["Brno", 49.1951, 16.6068],
  ["Ostrava", 49.8209, 18.2625],
  ["Plzeň", 49.7475, 13.3776],
  ["Liberec", 50.7663, 15.0543],
  ["Olomouc", 49.5938, 17.2509],
  ["Hradec Králové", 50.2092, 15.8328],
  ["České Budějovice", 48.9745, 14.4743],
  ["Pardubice", 50.0343, 15.7812],
  ["Zlín", 49.2264, 17.6707],
  ["Ústí nad Labem", 50.6607, 14.0323],
  ["Karlovy Vary", 50.2329, 12.8711],
  ["Jihlava", 49.3961, 15.5912],
  ["Kladno", 50.1477, 14.1028],
  ["Most", 50.5031, 13.6362],
  ["Opava", 49.9387, 17.9026],
  ["Frýdek-Místek", 49.6886, 18.3506],
  ["Děčín", 50.7821, 14.2148],
  ["Teplice", 50.6404, 13.8245],
  ["Prostějov", 49.4719, 17.1118],
];

// URL slugy měst (bez diakritiky) pro městské SEO stránky.
const CITY_SLUGS: Record<string, string> = {
  "Praha": "praha",
  "Brno": "brno",
  "Ostrava": "ostrava",
  "Plzeň": "plzen",
  "Liberec": "liberec",
  "Olomouc": "olomouc",
  "Hradec Králové": "hradec-kralove",
  "České Budějovice": "ceske-budejovice",
  "Pardubice": "pardubice",
  "Zlín": "zlin",
  "Ústí nad Labem": "usti-nad-labem",
  "Karlovy Vary": "karlovy-vary",
  "Jihlava": "jihlava",
  "Kladno": "kladno",
  "Most": "most",
  "Opava": "opava",
  "Frýdek-Místek": "frydek-mistek",
  "Děčín": "decin",
  "Teplice": "teplice",
  "Prostějov": "prostejov",
};

export function citySlug(name: string): string {
  return CITY_SLUGS[name] ?? name.toLowerCase().replace(/\s+/g, "-");
}

export function cityFromSlug(slug: string): string | null {
  return CITIES.find((c) => citySlug(c[0]) === slug)?.[0] ?? null;
}
