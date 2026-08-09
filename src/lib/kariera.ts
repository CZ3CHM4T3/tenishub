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
export const SKILL_ICONS: Record<string, string> = {
  // raketa — hlava s výpletem + rukojeť
  racket: '<ellipse cx="9" cy="8.3" rx="5.3" ry="6.1"/><path d="M7.3 3.6v9.4M10.7 3.6v9.4M4.4 6.6h9.2M4.4 10h9.2"/><path d="M12.8 12.9 19.4 20"/>',
  // tenisový míč se švy
  ball: '<circle cx="12" cy="12" r="8"/><path d="M5 8.6c4.2 2.2 9.8 2.2 14 0M5 15.4c4.2-2.2 9.8-2.2 14 0"/>',
  // panáček podává — ruka nahoře s míčem
  serve: '<circle cx="9.3" cy="4" r="1.8"/><path d="M9.3 5.8v6.6M9.3 8l4.6-3.2M9.3 8 6 10M9.3 12.4l-2.4 7.6M9.3 12.4l2.9 7.6"/><circle cx="15" cy="4" r="1.2"/>',
  // volej — panáček s raketou vepředu u sítě
  volley: '<circle cx="7.3" cy="4.6" r="1.7"/><path d="M7.3 6.3v6.3M7.3 8.3l4.7-1M7.3 12.6l-2 7M7.3 12.6l2.4 7"/><ellipse cx="15.2" cy="7" rx="2.3" ry="2.9" transform="rotate(22 15.2 7)"/>',
  // síť
  net: '<path d="M3 7.5h18M3 7.5v9M21 7.5v9M3 16.5h18M7 7.5v9M11 7.5v9M15 7.5v9M3 12h18"/>',
  // bota / práce nohou
  footwork: '<path d="M3 15.5h10.6l4.8-1.6c1.7-.6 1.6-2.8-.2-3.1l-4.6-.8-3-4H5l.9 5.5L3 11.1z"/><path d="M3 18.6h12.8"/>',
  // skluz — panáček + stopa smyku
  slide: '<circle cx="8" cy="5" r="1.7"/><path d="M8 6.7l1 4 4 1.2M9 10.7l-1.6 4.3"/><path d="M4 18.5h13M6 18.5l3-3M14 15.5l1.4 3"/>',
  // běh — dynamický panáček
  run: '<circle cx="14.5" cy="4.6" r="1.8"/><path d="M13.4 6.6 11 10.6l-3.6 1.6M11 10.6l4.1 1.3 1 5.6M11 10.6 8.4 18.2M15.1 11.9l3.6-1.5"/>',
  // skok — panáček ve výskoku, ruce nahoře
  jump: '<circle cx="12" cy="3.7" r="1.8"/><path d="M12 5.5v5.6M7.4 7.2 12 5.8l4.6 1.4M12 11.1 9 16M12 11.1 15 16"/>',
  // obratnost — tréninkový kužel
  agility: '<path d="M9.4 4.5h5.2l3.2 12.5H6.2zM8 11.5h8M4.5 20h15"/>',
  // rovnováha — panáček na jedné noze, ruce rozpažené
  balance: '<circle cx="12" cy="3.9" r="1.7"/><path d="M12 5.6v6M8.4 8.2 12 6.9l3.6 1.3M12 11.6l-2.6 4.8M12 11.6v4.8M5 20h14"/>',
  // střed těla — trup s břišáky
  core: '<rect x="7.5" y="3.6" width="9" height="16.8" rx="4.5"/><path d="M12 5.6v12.8M9.3 9.5h5.4M9.3 12.5h5.4M9.3 15.5h5.4"/>',
  // síla — činka
  strength: '<path d="M6 7.4v9.2M18 7.4v9.2M3 9.6v4.8M21 9.6v4.8M6 12h12"/>',
  // přítah / shyb — panáček visící na hrazdě
  pull: '<path d="M3 4h18M8 4.2v2.6M16 4.2v2.6"/><circle cx="12" cy="8.9" r="1.7"/><path d="M8 6.8l4 1 4-1M12 10.6v4.6M9.4 20 12 15.2 14.6 20"/>',
  // tlak / klik — panáček v kliku
  push: '<circle cx="4.8" cy="9" r="1.7"/><path d="M6.4 9.8 16 13.6M16 13.6v3.9M9.6 12.2v3.3M4 17.5h16"/>',
  // dřep — panáček s činkou na ramenou
  squat: '<circle cx="12" cy="3.8" r="1.7"/><path d="M6.4 7h11.2M12 5.5v3.6l-3 3.6V19M12 9.1l3 3.6V19"/>',
  // rotace těla — kruhová šipka kolem osy
  rotate: '<path d="M19.5 12a7.5 7.5 0 1 1-2.7-5.8"/><path d="M19.6 4.6v3.8h-3.8"/><circle cx="12" cy="12" r="2.2"/>',
  // protažení — panáček ve výpadu / sahá na špičku
  stretch: '<circle cx="7.4" cy="4.2" r="1.7"/><path d="M7.4 6v5.6l6 2.2M7.4 9l4-2M13.4 13.8 12.2 20M13.4 13.8l4-2.4"/>',
  // švihadlo — panáček s obloukem lana
  rope: '<circle cx="12" cy="13.4" r="1.6"/><path d="M12 15v3.6M9.4 21 12 18.4 14.6 21"/><path d="M6.2 5.2v4.6a5.8 5.8 0 0 0 11.6 0V5.2"/><circle cx="6.2" cy="4" r="1.2"/><circle cx="17.8" cy="4" r="1.2"/>',
  // dech — plíce
  breath: '<path d="M12 4v7"/><path d="M12 11c0-2.8-2.4-3.8-3.9-2.8S6 11 6 14c0 2 1 3.8 3 3.8s3-1.8 3-3.8"/><path d="M12 11c0-2.8 2.4-3.8 3.9-2.8S18 11 18 14c0 2-1 3.8-3 3.8s-3-1.8-3-3.8"/>',
  // přesnost — terč
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1.2"/>',
  // obrana — štít se zaškrtnutím
  defense: '<path d="M12 3 5 5.8v5.4c0 4.3 3 7.4 7 8.3 4-.9 7-4 7-8.3V5.8z"/><path d="M9.2 11.8l2 2 3.6-4"/>',
  // rotace míče — míč s obtáčející šipkou
  spin: '<circle cx="12" cy="12" r="5.4"/><path d="M17.6 8.6a6.6 6.6 0 0 1-9.2 8.6"/><path d="M8.4 3.4 7.2 6.6l3.2.9"/>',
  // koordinace — žonglování
  coord: '<circle cx="7.4" cy="14" r="3.1"/><circle cx="16.6" cy="14" r="3.1"/><circle cx="12" cy="6" r="1.5"/>',
  // reakce — stopky s bleskem
  reaction: '<circle cx="12" cy="13.5" r="6.5"/><path d="M10 3h4M12 3v1.6M18.4 6.6 19.6 5.4"/><path d="M12.6 10.6 10.4 14h3.2l-2.2 3.4"/>',
  // ohebnost — most / záklon
  flex: '<circle cx="6" cy="18.4" r="1.3"/><circle cx="18" cy="18.4" r="1.3"/><path d="M6 18.4C6 9 18 9 18 18.4"/><path d="M12 12V8.4"/>',
  // plank — panáček ve vzporu
  plank: '<circle cx="4.9" cy="10.5" r="1.7"/><path d="M6.5 11.2 18 14M8.6 12.9v3.6M16 14v2.5M4 17.2h16"/>',
  // úder / švih — oblouk švihu s raketou
  swing: '<path d="M4 20C6.5 11 13 5 20 4"/><path d="M14.5 4H20v5.5"/><ellipse cx="5.5" cy="18" rx="2.2" ry="2.6"/>',
  // gymnastika — gymnasta ve hvězdě
  gym: '<circle cx="12" cy="4" r="1.8"/><path d="M12 5.8 6.5 12M12 5.8 17.5 12M5 10.5h14M8.5 20 12 12l3.5 8"/>',
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
