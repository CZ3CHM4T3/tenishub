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
  ["Havířov", 49.7799, 18.4369],
  ["Karviná", 49.8540, 18.5417],
  ["Chomutov", 50.4605, 13.4178],
  ["Jablonec nad Nisou", 50.7243, 15.1710],
  ["Mladá Boleslav", 50.4114, 14.9030],
  ["Přerov", 49.4551, 17.4509],
  ["Třebíč", 49.2149, 15.8819],
  ["Třinec", 49.6776, 18.6708],
  ["Tábor", 49.4144, 14.6578],
  ["Znojmo", 48.8555, 16.0488],
  ["Příbram", 49.6899, 14.0104],
  ["Cheb", 50.0796, 12.3730],
  ["Kolín", 50.0281, 15.2003],
  ["Písek", 49.3088, 14.1475],
  ["Trutnov", 50.5610, 15.9127],
  ["Kroměříž", 49.2979, 17.3931],
  ["Šumperk", 49.9653, 16.9705],
  ["Vsetín", 49.3388, 17.9962],
  ["Uherské Hradiště", 49.0697, 17.4597],
  ["Břeclav", 48.7591, 16.8825],
  ["Hodonín", 48.8489, 17.1320],
  ["Litoměřice", 50.5347, 14.1319],
  ["Havlíčkův Brod", 49.6078, 15.5800],
  ["Náchod", 50.4155, 16.1657],
  ["Žďár nad Sázavou", 49.5626, 15.9394],
  ["Sokolov", 50.1814, 12.6401],
  ["Vyškov", 49.2775, 16.9988],
  ["Blansko", 49.3645, 16.6477],
  ["Beroun", 49.9636, 14.0729],
  ["Kutná Hora", 49.9484, 15.2680],
  ["Klatovy", 49.3958, 13.2954],
  ["Strakonice", 49.2619, 13.9027],
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
  return (CITY_SLUGS[name] ?? name)
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // pryč s diakritikou
    .replace(/\s+/g, "-");
}

export function cityFromSlug(slug: string): string | null {
  return CITIES.find((c) => citySlug(c[0]) === slug)?.[0] ?? null;
}
