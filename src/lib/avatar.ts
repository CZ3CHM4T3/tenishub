export type Av = { slug: string; name: string; g: "kluk" | "holka" };

export const AVATARS: Av[] = [
  { slug: "alex", name: "Alex", g: "kluk" },
  { slug: "bruno", name: "Bruno", g: "kluk" },
  { slug: "carlos", name: "Carlos", g: "kluk" },
  { slug: "dre", name: "Dre", g: "kluk" },
  { slug: "felix", name: "Felix", g: "kluk" },
  { slug: "fredy", name: "Fredy", g: "kluk" },
  { slug: "haru", name: "Haru", g: "kluk" },
  { slug: "hiroshi", name: "Hiroshi", g: "kluk" },
  { slug: "jachym", name: "Jáchym", g: "kluk" },
  { slug: "jan", name: "Jan", g: "kluk" },
  { slug: "jax", name: "Jax", g: "kluk" },
  { slug: "krystof", name: "Kryštof", g: "kluk" },
  { slug: "luka", name: "Luka", g: "kluk" },
  { slug: "martin", name: "Martin", g: "kluk" },
  { slug: "matej", name: "Matěj", g: "kluk" },
  { slug: "petr", name: "Petr", g: "kluk" },
  { slug: "rafael", name: "Rafael", g: "kluk" },
  { slug: "ragnar", name: "Ragnar", g: "kluk" },
  { slug: "raj", name: "Raj", g: "kluk" },
  { slug: "ricardo", name: "Ricardo", g: "kluk" },
  { slug: "robert", name: "Robert", g: "kluk" },
  { slug: "samuel", name: "Samuel", g: "kluk" },
  { slug: "stefan", name: "Stefan", g: "kluk" },
  { slug: "sven", name: "Sven", g: "kluk" },
  { slug: "tobias", name: "Tobiáš", g: "kluk" },
  { slug: "tommy", name: "Tommy", g: "kluk" },
  { slug: "vincent", name: "Vincent", g: "kluk" },
  { slug: "xander", name: "Xander", g: "kluk" },
  { slug: "adela", name: "Adéla", g: "holka" },
  { slug: "amalie", name: "Amálie", g: "holka" },
  { slug: "amara", name: "Amara", g: "holka" },
  { slug: "annika", name: "Annika", g: "holka" },
  { slug: "ariana", name: "Ariana", g: "holka" },
  { slug: "barbora", name: "Barbora", g: "holka" },
  { slug: "celeste", name: "Celeste", g: "holka" },
  { slug: "celine", name: "Celine", g: "holka" },
  { slug: "coco", name: "Coco", g: "holka" },
  { slug: "elina", name: "Elina", g: "holka" },
  { slug: "eliska", name: "Eliška", g: "holka" },
  { slug: "ella", name: "Ella", g: "holka" },
  { slug: "ester", name: "Ester", g: "holka" },
  { slug: "fiona", name: "Fiona", g: "holka" },
  { slug: "francesca", name: "Francesca", g: "holka" },
  { slug: "freya", name: "Freya", g: "holka" },
  { slug: "jasmina", name: "Jasmína", g: "holka" },
  { slug: "laura", name: "Laura", g: "holka" },
  { slug: "lenka", name: "Lenka", g: "holka" },
  { slug: "meda", name: "Meda", g: "holka" },
  { slug: "michelle", name: "Michelle", g: "holka" },
  { slug: "nikola", name: "Nikola", g: "holka" },
  { slug: "simona", name: "Simona", g: "holka" },
  { slug: "stella", name: "Stella", g: "holka" },
  { slug: "viktorie", name: "Viktorie", g: "holka" },
  { slug: "yumi", name: "Yumi", g: "holka" },
  { slug: "zara", name: "Zara", g: "holka" },
  { slug: "zoe", name: "Zoe", g: "holka" },
  { slug: "zola", name: "Zola", g: "holka" },
];

export const AVBG = ["epic1", "epic2", "epic3", "epic4", "epic5", "epic6", "bg1", "bg2", "bg3", "bg4", "bg5", "bg6", "bg7", "bg8"];
export const EPIC_BG = ["epic1", "epic2", "epic3", "epic4", "epic5", "epic6"];

export const avatarSrc = (slug: string) => `/avatars/${slug}.png`;
export const bgSrc = (bg: string) => (bg.startsWith("epic") ? `/avbg/${bg}.svg` : `/avbg/${bg}.png`);

// Globální ukotvení postavy (per charakter, ne per dítě) — jak se busta zobrazí v rámečku všude.
export type AvatarFrame = { zoom: number; ox: number; oy: number };
export type AvatarFrames = Record<string, AvatarFrame>;
export const DEFAULT_FRAME: AvatarFrame = { zoom: 100, ox: 0, oy: 0 };
export function frameOf(frames: AvatarFrames | null | undefined, slug: string): AvatarFrame {
  return frames?.[slug] ?? DEFAULT_FRAME;
}
export const nameOf = (slug: string) =>
  AVATARS.find((a) => a.slug === slug)?.name ?? slug;

// Reálné jméno + přezdívka uprostřed: Jan „CZ3CHM4T3" Schröffel
export function fmtName(jmeno: string, prezdivka?: string | null): string {
  const nick = (prezdivka ?? "").trim();
  if (!nick) return jmeno;
  const parts = jmeno.trim().split(/\s+/);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const first = parts.slice(0, -1).join(" ");
    return `${first} „${nick}" ${last}`;
  }
  return `${jmeno} „${nick}"`;
}
