// Lehká moderace vstupů od návštěvníků (kontakt, fórum apod.).
// Cíl: chytit zjevný spam / porno / vulgární útoky, ale NEblokovat běžný dotaz.
// Proto je blocklist krátký a míří jen na jednoznačné věci; hlavní obranou
// je honeypot (v API) + heuristiky na spam (odkazy, opakování).

const norm = (s: string) =>
  s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // pryč diakritika
    .replace(/[^a-z0-9\s]/g, " ");

// Jen jednoznačně spam/porno/urážky (whole-word). Běžný tenisový dotaz je neobsahuje.
const BANNED: string[] = [
  // porno / sex spam
  "porn", "porno", "xxx", "sexcam", "camgirl", "escort", "milf", "nude", "nudes",
  "dickpic", "bigcock", "cumshot", "blowjob", "onlyfans",
  // lékárna / casino / crypto spam
  "viagra", "cialis", "casino", "kasino", "bookmaker", "bet365", "loan", "bitcoin generator",
  // vulgární útoky (CZ) — jen ty nejtvrdší jako signál útoku, ne běžná mluva
  "kunda", "kokot", "mrdka", "zmrd", "piczo",
];
const BANNED_SET = new Set(BANNED.map(norm).map((s) => s.trim()));

export type ModResult = { ok: true } | { ok: false; reason: string };

export function checkMessage(raw: string): ModResult {
  const text = (raw ?? "").trim();
  if (text.length < 3) return { ok: false, reason: "Napište prosím delší dotaz." };
  if (text.length > 2000) return { ok: false, reason: "Dotaz je moc dlouhý (max 2000 znaků)." };

  const words = new Set(norm(text).split(/\s+/).filter(Boolean));
  for (const w of BANNED_SET) if (words.has(w)) return { ok: false, reason: "spam" };
  // víceslovné fráze
  const flat = norm(text);
  for (const b of BANNED_SET) if (b.includes(" ") && flat.includes(b)) return { ok: false, reason: "spam" };

  // spam heuristiky
  const links = (text.match(/https?:\/\/|www\.|\.[a-z]{2,3}\//gi) || []).length;
  if (links >= 3) return { ok: false, reason: "spam" };
  if (/(.)\1{9,}/.test(text)) return { ok: false, reason: "spam" }; // 10× stejný znak
  const letters = text.replace(/[^a-zA-Zá-žÁ-Ž]/g, "").length;
  const caps = text.replace(/[^A-ZÁ-Ž]/g, "").length;
  if (letters > 25 && caps / letters > 0.8) return { ok: false, reason: "spam" }; // CELÉ VELKÝM

  return { ok: true };
}
