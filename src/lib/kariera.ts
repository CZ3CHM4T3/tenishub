// Sdílená data + logika Kariéry — používá zobrazení (Kariera.tsx) i admin zápis progresu.

export const IC: Record<string, string> = {
  uder: '<ellipse cx="9" cy="9" rx="5" ry="6" transform="rotate(-30 9 9)"/><path d="M12 12l7 8"/>',
  podani: '<path d="M12 21V7M7 12l5-5 5 5"/><circle cx="12" cy="4" r="1.4"/>',
  sit: '<path d="M3 8h18v11H3zM8 8v11M13 8v11M18 8v11M3 13h18"/>',
  rotace: '<path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v3h-3"/><circle cx="12" cy="12" r="2.2"/>',
  footwork: '<path d="M3 16h12l4.5-2c1.4-.6 1.2-2.4-.4-2.7L14 10l-3-4H6l1 5-4 1z"/><path d="M3 19h13"/>',
  kondice: '<path d="M4 12h4l2-5 3 10 2-5h5"/>',
  takt: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  kalis: '<circle cx="12" cy="5" r="2"/><path d="M12 7v6M8 21l4-8 4 8M5 11h14"/>',
  gym: '<circle cx="12" cy="5" r="2"/><path d="M12 7 6 20M12 7l6 13M5 12h14"/>',
  atle: '<circle cx="14" cy="5" r="2"/><path d="M4 20l5-7 3 2 3-5 5 3"/>',
  kettle: '<circle cx="12" cy="14" r="6"/><path d="M9 8a3 3 0 0 1 6 0"/>',
  posil: '<path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12"/>',
  expand: '<path d="M4 12h16M7 8l-3 4 3 4M17 8l3 4-3 4"/>',
  animal: '<path d="M4 14c2 0 3-2 3-2s1 2 3 2M14 14c2 0 3-2 3-2s1 2 3 2M8 18h8"/>',
  rope: '<path d="M3 12c3-6 6 6 9 0s6-6 9 0"/>',
  mob: '<path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/>',
  balance: '<path d="M12 3v18M4 21h16M12 8 5 12M12 8l7 4"/>',
  agil: '<path d="M4 20 20 4M9 4h11v11"/>',
  dech: '<path d="M4 12h6l2-4 3 8 2-4h3"/>',
};

export type Chapter = { k: string; n: string; c: string; g: "kurt" | "mimo" };
export const ALLCH: Chapter[] = [
  { k: "uder", n: "Základní údery", c: "#7aa11a", g: "kurt" },
  { k: "rotace", n: "Rotace & kontrola", c: "#8ab028", g: "kurt" },
  { k: "podani", n: "Podání & return", c: "#6ba32a", g: "kurt" },
  { k: "sit", n: "Hra u sítě", c: "#5f9e2e", g: "kurt" },
  { k: "footwork", n: "Footwork — práce nohou", c: "#3f8f3a", g: "kurt" },
  { k: "kondice", n: "Kondice na kurtu", c: "#2f8f52", g: "kurt" },
  { k: "takt", n: "Taktika & zápas", c: "#4f9440", g: "kurt" },
  { k: "kalis", n: "Kalistenika", c: "#3b82f6", g: "mimo" },
  { k: "gym", n: "Gymnastika", c: "#a855f7", g: "mimo" },
  { k: "atle", n: "Atletika", c: "#ef4444", g: "mimo" },
  { k: "kettle", n: "Kettlebell", c: "#f59e0b", g: "mimo" },
  { k: "posil", n: "Posilování", c: "#0ea5e9", g: "mimo" },
  { k: "expand", n: "Expandery", c: "#14b8a6", g: "mimo" },
  { k: "animal", n: "Animal Flow", c: "#f97316", g: "mimo" },
  { k: "rope", n: "Flow Rope", c: "#ec4899", g: "mimo" },
  { k: "mob", n: "Mobilita", c: "#22c55e", g: "mimo" },
  { k: "balance", n: "Rovnováha", c: "#6366f1", g: "mimo" },
  { k: "agil", n: "Obratnost & parkour", c: "#eab308", g: "mimo" },
  { k: "dech", n: "Dech & regenerace", c: "#06b6d4", g: "mimo" },
];

// req = prerekvizity ve STEJNÉ kapitole (id uzlů). xreq = kombo prerekvizity z JINÉHO stromu (klíče "kapitola:uzel").
export type Node = { id: string; n: string; xp: number; col: number; row: number; req: string[]; desc?: string; icon?: string; xreq?: string[] };

// ---- IKONY DOVEDNOSTÍ (promyšlené, ne emoji) — stroke SVG jako IC ----
// Fitness/pohybové ikony jsou z Tabler Icons (MIT) — čisté, symetrické,
// stejný stroke styl. Tenisové speciály (raketa/síť/švih/podání/volej)
// a pár cviků dokresleny ručně ve stejném duchu.
export const SKILL_ICONS: Record<string, string> = {
  // raketa — kruhová hlava s pravidelným výpletem + rovná rukojeť
  racket: '<path d="M7 8a5 5 0 1 0 10 0a5 5 0 1 0 -10 0" /><path d="M12 3.5v9M9.6 4.3v7.4M14.4 4.3v7.4" /><path d="M7.5 8h9M8.3 5.6h7.4M8.3 10.4h7.4" /><path d="M12 13v8M10.5 21h3" />',
  // tenisový míč (Tabler ball-tennis)
  ball: '<path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M6 5.3a9 9 0 0 1 0 13.4" /><path d="M18 5.3a9 9 0 0 0 0 13.4" />',
  // podání — raketa nahoře + nadhozený míč
  serve: '<path d="M12.6 3.6a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" /><path d="M12.4 11a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0 -5.2 0" /><path d="M15 8.4v5.2M12.4 11h5.2" /><path d="M13.3 12.9l-6.3 7.1" />',
  // volej — raketa vepředu + míč
  volley: '<path d="M4.4 10a2.8 2.8 0 1 0 5.6 0a2.8 2.8 0 1 0 -5.6 0" /><path d="M7.2 7.2v5.6M4.4 10h5.6" /><path d="M9.2 12l5 5.4" /><path d="M15.6 8a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" />',
  // síť — symetrická mřížka se sloupky
  net: '<path d="M3 7.5h18v9h-18z" /><path d="M6 7.5v9M9 7.5v9M12 7.5v9M15 7.5v9M18 7.5v9" /><path d="M3 12h18" /><path d="M3 16.5v2.5M21 16.5v2.5" /><path d="M3 19h18" />',
  // bota (Tabler shoe)
  footwork: '<path d="M4 6h5.426a1 1 0 0 1 .863 .496l1.064 1.823a3 3 0 0 0 1.896 1.407l4.677 1.114a4 4 0 0 1 3.074 3.89v2.27a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-10a1 1 0 0 1 1 -1" /><path d="M14 13l1 -2" /><path d="M8 18v-1a4 4 0 0 0 -4 -4h-1" /><path d="M10 12l1.5 -3" />',
  // pohyb / skluz (Tabler walk)
  slide: '<path d="M12 4a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M7 21l3 -4" /><path d="M16 21l-2 -4l-3 -3l1 -6" /><path d="M6 12l2 -3l4 -1l3 3l3 1" />',
  // běh (Tabler run)
  run: '<path d="M11.007 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M4 17l5 1l.75 -1.5" /><path d="M15 21v-4l-4 -3l1 -6" /><path d="M7 12v-3l5 -1l3 3l3 1" />',
  // skok (Tabler ski-jumping)
  jump: '<path d="M17 17.5l-5 -4.5v-6l5 4" /><path d="M7 17.5l5 -4.5" /><path d="M15.103 21.58l6.762 -14.502a2 2 0 0 0 -.968 -2.657" /><path d="M8.897 21.58l-6.762 -14.503a2 2 0 0 1 .968 -2.657" /><path d="M7 11l5 -4" /><path d="M10.007 4a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />',
  // obratnost — kužel (Tabler cone)
  agility: '<path d="M21 17.998v-.5l-8.13 -14.99a1 1 0 0 0 -1.74 0l-8.13 14.989v.5c0 1.659 4.03 3.003 9 3.003s9 -1.344 9 -3.002" /><path d="M8 11.5h8" />',
  // rovnováha — jóga pozice (Tabler yoga)
  balance: '<path d="M4 20h4l1.5 -3" /><path d="M17 20l-1 -5h-5l1 -7" /><path d="M4 10l4 -1l4 -1l4 1.5l4 1.5" /><path d="M10.007 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />',
  // střed těla — trup s břišáky (kapsle + osa + rungy)
  core: '<path d="M12 3a4 4 0 0 1 4 4v9a4 4 0 0 1 -8 0v-9a4 4 0 0 1 4 -4z" /><path d="M12 4v15M9.5 8.5h5M9.5 12h5M9.5 15.5h5" />',
  // síla — velká činka (Tabler barbell)
  strength: '<path d="M2 12h1" /><path d="M6 8h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2" /><path d="M6 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1" /><path d="M9 12h6" /><path d="M15 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1" /><path d="M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-2" /><path d="M22 12h-1" />',
  // přítah / shyb — jednoručka (Tabler dumbbell)
  pull: '<path d="M7.026 9.61l-.95 -4.18a2 2 0 0 1 1.95 -2.43h8a2 2 0 0 1 2 2.43l-1 4.2" /><path d="M9.026 17.001h6" /><path d="M18.906 20.06a7.92 7.92 0 0 0 1 -5.33a8 8 0 1 0 -14.77 5.33a2 2 0 0 0 1.71 .94h10.36a2 2 0 0 0 1.7 -.94" />',
  // tlak / klik — kettlebell (Tabler weight)
  push: '<path d="M9 6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M6.835 9h10.33a1 1 0 0 1 .984 .821l1.637 9a1 1 0 0 1 -.984 1.179h-13.604a1 1 0 0 1 -.984 -1.179l1.637 -9a1 1 0 0 1 .984 -.821" />',
  // dřep — figura s činkou na ramenou
  squat: '<path d="M10 3.5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M6.5 7h11" /><path d="M12 5.5v3.5" /><path d="M12 9l-3 3.5v5.5M12 9l3 3.5v5.5" />',
  // rotace těla — kruhová šipka (Tabler rotate)
  rotate: '<path d="M19.95 11a8 8 0 1 0 -.5 4m.5 5v-5h-5" />',
  // protažení (Tabler stretching)
  stretch: '<path d="M15 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M5 20l5 -.5l1 -2" /><path d="M18 20v-5h-5.5l2.5 -6.5l-5.5 1l1.5 2" />',
  // švihadlo (Tabler jump-rope)
  rope: '<path d="M6 14v-6a3 3 0 1 1 6 0v8a3 3 0 0 0 6 0v-6" /><path d="M16 5a2 2 0 0 1 2 -2a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2a2 2 0 0 1 -2 -2l0 -3" /><path d="M4 16a2 2 0 0 1 2 -2a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2a2 2 0 0 1 -2 -2l0 -3" />',
  // dech — plíce (Tabler lungs)
  breath: '<path d="M6.081 20c1.612 0 2.919 -1.335 2.919 -2.98v-9.763c0 -.694 -.552 -1.257 -1.232 -1.257c-.205 0 -.405 .052 -.584 .15l-.13 .083c-1.46 1.059 -2.432 2.647 -3.404 5.824c-.42 1.37 -.636 2.962 -.648 4.775c-.012 1.675 1.261 3.054 2.877 3.161l.203 .007" /><path d="M17.92 20c-1.613 0 -2.92 -1.335 -2.92 -2.98v-9.763c0 -.694 .552 -1.257 1.233 -1.257c.204 0 .405 .052 .584 .15l.13 .083c1.46 1.059 2.432 2.647 3.405 5.824c.42 1.37 .636 2.962 .648 4.775c.012 1.675 -1.261 3.054 -2.878 3.161l-.202 .007" /><path d="M9 12a3 3 0 0 0 3 -3a3 3 0 0 0 3 3" /><path d="M12 4v5" />',
  // přesnost — terč (Tabler target)
  target: '<path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M7 12a5 5 0 1 0 10 0a5 5 0 1 0 -10 0" /><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />',
  // obrana — štít se zaškrtnutím (Tabler shield-check)
  defense: '<path d="M11.46 20.846a12 12 0 0 1 -7.96 -14.846a12 12 0 0 0 8.5 -3a12 12 0 0 0 8.5 3a12 12 0 0 1 -.09 7.06" /><path d="M15 19l2 2l4 -4" />',
  // rotace míče — kruhová šipka 360 (Tabler rotate-360)
  spin: '<path d="M12 16h4v4" /><path d="M19.458 11.042c.86 -2.366 .722 -4.58 -.6 -5.9c-2.272 -2.274 -7.185 -1.045 -10.973 2.743c-3.788 3.788 -5.017 8.701 -2.744 10.974c2.227 2.226 6.987 1.093 10.74 -2.515" />',
  // koordinace — žonglování (3 míče + oblouk chytání)
  coord: '<path d="M10.5 4.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" /><path d="M4.5 12.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" /><path d="M16.5 12.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" /><path d="M5 15.5c0 3 3 4.5 7 4.5s7 -1.5 7 -4.5" />',
  // reakce — blesk (Tabler bolt)
  reaction: '<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />',
  // ohebnost — protažení (Tabler stretching-2)
  flex: '<path d="M6.5 21l3.5 -5" /><path d="M5 11l7 -2" /><path d="M16 21l-4 -7v-5l7 -4" /><path d="M9.007 6a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />',
  // plank — vzpor na předloktí
  plank: '<path d="M3 10a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M7 10.5l9.5 3.2" /><path d="M8.5 12.2l-1.5 4.8h6" /><path d="M16.5 13.7l3 1.3" /><path d="M4 18.5h16" />',
  // úder / švih — pálka + míč (Tabler ping-pong)
  swing: '<path d="M12.718 20.713a7.64 7.64 0 0 1 -7.48 -12.755l.72 -.72a7.643 7.643 0 0 1 9.105 -1.283l2.387 -2.345a2.08 2.08 0 0 1 3.057 2.815l-.116 .126l-2.346 2.387a7.644 7.644 0 0 1 -1.052 8.864" /><path d="M11 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M9.3 5.3l9.4 9.4" />',
  // gymnastika (Tabler gymnastics)
  gym: '<path d="M7 7a1 1 0 1 0 2 0a1 1 0 0 0 -2 0" /><path d="M13 21l1 -9l7 -6" /><path d="M3 11h6l5 1" /><path d="M11.5 8.5l4.5 -3.5" />',
};
export const SKILL_ICON_LIST: { k: string; label: string }[] = [
  { k: "racket", label: "Raketa" }, { k: "ball", label: "Míč" }, { k: "serve", label: "Podání" },
  { k: "volley", label: "Volej" }, { k: "net", label: "Síť" }, { k: "footwork", label: "Práce nohou" },
  { k: "slide", label: "Skluz" }, { k: "run", label: "Běh" }, { k: "jump", label: "Skok" },
  { k: "agility", label: "Obratnost" }, { k: "balance", label: "Rovnováha" }, { k: "core", label: "Střed těla" },
  { k: "strength", label: "Síla" }, { k: "pull", label: "Přítah/shyb" }, { k: "push", label: "Tlak/klik" },
  { k: "squat", label: "Dřep" }, { k: "rotate", label: "Rotace" }, { k: "stretch", label: "Protažení" },
  { k: "rope", label: "Švihadlo/rope" }, { k: "breath", label: "Dech" }, { k: "target", label: "Přesnost" },
  { k: "defense", label: "Obrana" }, { k: "spin", label: "Rotace míče" }, { k: "coord", label: "Koordinace" },
  { k: "reaction", label: "Reakce" }, { k: "flex", label: "Ohebnost" }, { k: "plank", label: "Plank" },
  { k: "swing", label: "Úder/švih" }, { k: "gym", label: "Gymnastika" },
];

// Odvodí ikonu z názvu dovednosti (fallback, když uzel ikonu nemá).
export function autoIcon(name: string): string {
  const s = name.toLowerCase();
  const has = (...w: string[]) => w.some((x) => s.includes(x));
  if (has("forhend", "úder", "uder", "švih")) return "swing";
  if (has("bekhend")) return "swing";
  if (has("podání", "podani", "nadhoz")) return "serve";
  if (has("volej", "síť", "sít", "half")) return "volley";
  if (has("smeč", "smec")) return "agility";
  if (has("footwork", "práce nohou", "prace nohou", "nohou")) return "footwork";
  if (has("skluz", "slide")) return "slide";
  if (has("postoj", "držení", "drzeni", "raket")) return "racket";
  if (has("rotac", "spin", "umístění", "umisteni")) return "spin";
  if (has("return", "čtení", "cteni", "taktik", "plán", "plan", "výměn", "vymen")) return "target";
  if (has("dřep", "drep", "goblet")) return "squat";
  if (has("shyb", "přítah", "pritah", "vis", "deadlift")) return "pull";
  if (has("klik", "tlak", "dip", "press")) return "push";
  if (has("swing", "get-up", "kettle", "čink", "cink", "carry")) return "strength";
  if (has("skok", "přeskok", "preskok", "dálky", "dalky", "vault", "precision")) return "jump";
  if (has("běh", "beh", "sprint", "start", "štafeta", "stafeta", "abeceda")) return "run";
  if (has("rovnováh", "rovnovah", "stoj na jedné", "bosu", "slackline", "čár", "car")) return "balance";
  if (has("dech", "nosní", "nosni", "brániční", "branicni", "výdech", "vydech", "box breathing", "regener")) return "breath";
  if (has("kotoul", "stoj na rukou", "hvězda", "hvezda", "kotrmelec")) return "gym";
  if (has("most", "ohyb", "ohebn")) return "flex";
  if (has("rope", "osmičk", "osmick", "kruh", "vlna", "švihad", "svihad", "freestyle", "přehoz", "prehoz")) return "rope";
  if (has("kočka", "kocka", "kyčle", "kycle", "kotník", "kotnik", "ramen", "mobilit", "hrud", "protaž", "protaz")) return "stretch";
  if (has("beast", "crab", "ape", "scorpion", "animal", "flow")) return "coord";
  if (has("plank", "výdrž", "vydrz")) return "plank";
  if (has("reakc", "rychl", "obratn", "agil", "parkour", "dopad")) return "agility";
  if (has("core", "střed", "stred", "břich", "brich")) return "core";
  return "ball";
}
export function iconPathOf(node: { icon?: string; n: string }): string {
  const k = node.icon && SKILL_ICONS[node.icon] ? node.icon : autoIcon(node.n);
  return SKILL_ICONS[k] ?? SKILL_ICONS.ball;
}
export const TREES: Record<string, Node[]> = {
  uder: [
    { id: "a", n: "Postoj & držení rakety", xp: 20, col: 0, row: 1, req: [], desc: "Správný kontinentální/eastern grip a vyvážený připravený postoj — základ všech úderů." },
    { id: "b", n: "Forhend", xp: 30, col: 1, row: 0, req: ["a"], desc: "Základní forhendový úder z místa: nápřah, kontakt před tělem, plynulý dohmat." },
    { id: "c", n: "Bekhend", xp: 30, col: 1, row: 2, req: ["a"], desc: "Základní bekhend — jednoruč nebo obouruč, stabilní zápěstí a doprovod." },
    { id: "d", n: "Forhend s rotací", xp: 45, col: 2, row: 0, req: ["b"], desc: "Forhend s horní rotací (topspin) — nízko-vysoko, míč přepadá do kurtu." },
    { id: "e", n: "Obouruč bekhend", xp: 45, col: 2, row: 2, req: ["c"], desc: "Zpevněný obouruční bekhend pro kontrolu a délku úderu." },
    { id: "f", n: "Práce nohou", xp: 40, col: 2, row: 1, req: ["b", "c"], desc: "Split-step, dokrok k míči a návrat do středu — bez nohou není úder." },
    { id: "g", n: "Podání spodní", xp: 50, col: 3, row: 1, req: ["f"], desc: "Bezpečné spodní podání pro rozehru — zvládne i začátečník." },
    { id: "h", n: "Volej u sítě", xp: 55, col: 3, row: 0, req: ["d"], desc: "Krátký blokový volej z výskoku k síti, pevné zápěstí, žádný nápřah." },
    { id: "i", n: "Podání vrchní", xp: 70, col: 4, row: 1, req: ["g"], desc: "Vrchní podání s nadhozem a plným zásahem — hlavní zbraň hry." },
    { id: "j", n: "Smeč", xp: 75, col: 4, row: 0, req: ["h"], desc: "Smeč nad hlavou z lobu — časování, práce nohou vzad, razantní zásah." },
    { id: "k", n: "Herní taktika", xp: 90, col: 5, row: 1, req: ["i", "j", "e"], desc: "Spojení úderů do výměny: stavba bodu, čtení soupeře, volba úderu." },
  ],
};

const SKILLS_MAP: Record<string, string[]> = {
  podani: ["Postoj a nadhoz", "Spodní podání", "Rovné vrchní", "Podání s rotací", "Umístění", "Return"],
  rotace: ["Topspin forhend", "Topspin bekhend", "Slice bekhend", "Kroucené podání", "Výška nad sítí", "Kombinace rotací"],
  sit: ["Postoj u sítě", "Volej forhend", "Volej bekhend", "Half-volej", "Smeč", "Práce u sítě"],
  footwork: ["Split-step", "Přísunný krok", "Křížný krok", "Skluz (slide)", "Brzdění a návrat", "Práce vzad"],
  kondice: ["Rychlý start", "Změna směru", "Výdrž ve výměně", "Práce mezi kužely", "Reakční hry", "Kondiční okruh"],
  takt: ["Bezpečná hra", "Práce s délkou", "Střídání směru", "Stavba výměny", "Čtení soupeře", "Zápasový plán"],
  kalis: ["Mrtvý vis", "Kliky na kolenou", "Kliky", "Shyb s dopomocí", "Dip", "Shyb"],
  gym: ["Kotoul vpřed", "Kotoul vzad", "Stoj na rukou u zdi", "Hvězda", "Most", "Stoj na rukou"],
  atle: ["Běžecká abeceda", "Sprint 20 m", "Nízké starty", "Přeskoky", "Skok do dálky", "Štafeta"],
  kettle: ["Držení", "Deadlift", "Swing s dopomocí", "Swing", "Goblet dřep", "Get-up"],
  posil: ["Dřep", "Výpady", "Dřep s medicinbalem", "Sandbag carry", "Přítah činky", "Tlak nad hlavu"],
  expand: ["Rozpažování", "Přítahy", "Rotace trupu", "Dřep s odporem", "Tlak", "Chůze s odporem"],
  animal: ["Beast", "Crab", "Ape reach", "Scorpion", "Beast travel", "Flow"],
  rope: ["Kruhy", "Osmičky", "Přehození", "Vlna", "Kombinace", "Freestyle"],
  mob: ["Kočka–kráva", "Hrudník", "Kyčle", "Kotníky", "Ramena", "Full flow"],
  balance: ["Stoj na jedné", "Bosu", "Chůze po čáře", "Slackline", "Zavřené oči", "Dynamická"],
  agil: ["Dopad", "Přeskoky", "Kotoul přes rameno", "Vault", "Precision", "Combo"],
  dech: ["Nosní dech", "Brániční", "Prodloužený výdech", "Box breathing", "Dech v zátěži", "Regenerace"],
};

export function skillsOf(k: string) {
  return SKILLS_MAP[k] || ["Lv 1", "Lv 2", "Lv 3", "Lv 4", "Lv 5", "Lv 6"];
}
export function genTree(k: string): Node[] {
  return skillsOf(k).map((s, i) => ({
    id: "n" + i,
    n: s,
    xp: 20 + i * 12,
    col: i,
    row: 1,
    req: i ? ["n" + (i - 1)] : [],
  }));
}

// ---- KURIKULUM (celý strom) — editovatelné, uložené v DB ----
export type Curriculum = { chapters: Chapter[]; trees: Record<string, Node[]> };

// Výchozí kurikulum (seed) — z hardcoded dat, všechny stromy rozbalené na explicitní uzly.
export const DEFAULT_KURIKULUM: Curriculum = {
  chapters: ALLCH,
  trees: (() => {
    const t: Record<string, Node[]> = {};
    ALLCH.forEach((c) => (t[c.k] = TREES[c.k] ?? genTree(c.k)));
    return t;
  })(),
};

export function cloneCurriculum(cur: Curriculum): Curriculum {
  return {
    chapters: cur.chapters.map((c) => ({ ...c })),
    trees: Object.fromEntries(Object.entries(cur.trees).map(([k, ns]) => [k, ns.map((n) => ({ ...n, req: [...n.req], xreq: n.xreq ? [...n.xreq] : undefined }))])),
  };
}

// ---- VĚKOVÉ TRACKY — každý má vlastní (nezávislou) kopii kurikula ----
export type Track = "mini" | "junior" | "adults";
export const TRACKS: { k: Track; n: string; hint: string; emoji: string }[] = [
  { k: "mini", n: "MINI", hint: "mini a babytenis", emoji: "🐣" },
  { k: "junior", n: "JUNIOR", hint: "žáci", emoji: "🎾" },
  { k: "adults", n: "ADULTS", hint: "dorost a dospělí", emoji: "🏆" },
];
export type Kurikula = { tracks: Record<Track, Curriculum>; updated?: Partial<Record<Track, string>> };
export const DEFAULT_KURIKULA: Kurikula = {
  tracks: {
    mini: cloneCurriculum(DEFAULT_KURIKULUM),
    junior: cloneCurriculum(DEFAULT_KURIKULUM),
    adults: cloneCurriculum(DEFAULT_KURIKULUM),
  },
};

export function nodesOf(chapKey: string, cur: Curriculum): Node[] {
  return cur.trees[chapKey] ?? [];
}
export function chapMaxXP(chapKey: string, cur: Curriculum) {
  return nodesOf(chapKey, cur).reduce((s, n) => s + n.xp, 0);
}
export const key = (chap: string, nodeId: string) => `${chap}:${nodeId}`;

// ---- LEVELY / TIERY ----
export const MAX_LEVEL = 50;
export const R = 1.0724;
export const TIERS = [
  { n: "Dřevo", c: "#9a6b3a", e: "drevo" },
  { n: "Bronz", c: "#c07a33", e: "bronz" },
  { n: "Stříbro", c: "#c2ccd6", e: "stribro" },
  { n: "Zlato", c: "#e8b923", e: "zlato" },
  { n: "Platina", c: "#27c65a", e: "platina" },
  { n: "Diamant", c: "#bfe6ff", e: "diamant" },
  { n: "Ametyst", c: "#b061f5", e: "ametyst" },
  { n: "Vyzyvatel", c: "#2e7bff", e: "vyzyvatel" },
  { n: "Mistr", c: "#4aa3ff", e: "mistr" },
  { n: "Legenda", c: "#f0c419", e: "legenda" },
];
// Bez ligy (no rank) pro level 0–4 → jen obrys erbu. Dřevo začíná na levelu 5.
export const NORANK = { n: "Bez ligy", c: "#7d93b3", e: "norank" };
// -1 = no rank (level < 5), 0..9 = Dřevo…Legenda
export function tierOf(l: number) {
  return Math.min(9, Math.floor(l / 5) - 1);
}
export function tierAt(l: number) {
  const i = tierOf(l);
  return i < 0 ? NORANK : TIERS[i];
}
export function totalMaxXP(cur: Curriculum) {
  let s = 0;
  cur.chapters.forEach((c) => (cur.trees[c.k] ?? []).forEach((n) => (s += n.xp)));
  return s * 3;
}
export function lvlThr(L: number, mx: number) {
  return Math.round((mx * (Math.pow(R, L) - 1)) / (Math.pow(R, MAX_LEVEL) - 1));
}
export function levelFromXp(xp: number, mx: number) {
  for (let L = MAX_LEVEL; L >= 1; L--) if (xp >= lvlThr(L, mx)) return L;
  return 0;
}
export function pileSrc(p: number) {
  return p >= 50 ? "/pile/p50.png" : p >= 40 ? "/pile/p40.png" : p >= 30 ? "/pile/p30.png" : p >= 20 ? "/pile/p20.png" : p >= 10 ? "/pile/p10.png" : "/xp-coin.png";
}
export const fmt = (n: number) => n.toLocaleString("cs-CZ");

// ---- STAV DÍTĚTE z odemčených uzlů ----
export function nodeState(chapKey: string, node: Node, unlocked: Set<string>): "done" | "active" | "locked" {
  if (unlocked.has(key(chapKey, node.id))) return "done";
  const reqOk = node.req.every((r) => unlocked.has(key(chapKey, r)));
  const xreqOk = (node.xreq ?? []).every((k) => unlocked.has(k)); // kombo prerekvizity z jiného stromu
  return reqOk && xreqOk ? "active" : "locked";
}
// Info o kombo-prerekvizitě (klíč "kapitola:uzel") pro zobrazení: jméno + ikona + kapitola.
export function xreqInfo(cur: Curriculum, k: string): { name: string; icon: string; chapName: string; chapColor: string } | null {
  const [ch, id] = k.split(":");
  const chap = cur.chapters.find((c) => c.k === ch);
  const node = (cur.trees[ch] ?? []).find((n) => n.id === id);
  if (!chap || !node) return null;
  return { name: node.n, icon: iconPathOf(node), chapName: chap.n, chapColor: chap.c };
}
// všechny předchůdce (tranzitivně) — pro kaskádové odemčení
export function ancestorsOf(chapKey: string, nodeId: string, cur: Curriculum): string[] {
  const nodes = nodesOf(chapKey, cur);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out = new Set<string>();
  const walk = (id: string) => {
    const n = byId.get(id);
    if (!n) return;
    n.req.forEach((r) => {
      if (!out.has(r)) {
        out.add(r);
        walk(r);
      }
    });
  };
  walk(nodeId);
  return [...out];
}
// všichni potomci (co na uzlu závisí) — pro kaskádové zamčení při odebrání
export function descendantsOf(chapKey: string, nodeId: string, cur: Curriculum): string[] {
  const nodes = nodesOf(chapKey, cur);
  const out = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    nodes.forEach((n) => {
      if (out.has(n.id)) return;
      if (n.req.includes(nodeId) || n.req.some((r) => out.has(r))) {
        out.add(n.id);
        changed = true;
      }
    });
  }
  return [...out];
}

export type ChildState = {
  totalXp: number;
  maxXp: number;
  level: number;
  tier: { n: string; c: string; e: string };
  tierIndex: number;
  globalPct: number;
  byChapter: Record<string, { done: number; total: number; pct: number }>;
};
export function childState(unlocked: Set<string>, cur: Curriculum): ChildState {
  const maxXp = totalMaxXP(cur);
  let totalXp = 0;
  const byChapter: ChildState["byChapter"] = {};
  cur.chapters.forEach((c) => {
    const nodes = nodesOf(c.k, cur);
    let done = 0;
    nodes.forEach((n) => {
      if (unlocked.has(key(c.k, n.id))) {
        done++;
        totalXp += n.xp;
      }
    });
    byChapter[c.k] = { done, total: nodes.length, pct: Math.round((done / nodes.length) * 100) };
  });
  const level = levelFromXp(totalXp, maxXp);
  const ti = tierOf(level);
  return {
    totalXp,
    maxXp,
    level,
    tier: ti < 0 ? NORANK : TIERS[ti],
    tierIndex: ti,
    globalPct: Math.round((totalXp / maxXp) * 100),
    byChapter,
  };
}
