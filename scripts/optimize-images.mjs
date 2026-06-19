// Zmenší + zkomprimuje fotky v /public (beze změny názvů). Spustit: node scripts/optimize-images.mjs
import sharp from "sharp";
import { readFile, writeFile, rename, stat } from "node:fs/promises";
import path from "node:path";

const DIR = path.resolve("public");
const PHOTOS = [
  "role-trener", "role-hrac", "role-sparring", "role-areal", "role-fyzio", "role-fitness", "role-vyplet",
  "svet-rodic", "svet-sluzby", "videorozbor-1", "videorozbor-2", "videorozbor-rodic",
  "poradna", "moje-cesta", "bazar", "spolujizda", "najit-trener",
  "forum-rodice", "knihovna-rodic", "turnaje-rodic",
].map((n) => `${n}.png`);

const MAX_W = 1200;
let before = 0, after = 0;

for (const file of PHOTOS) {
  const fp = path.join(DIR, file);
  try {
    const orig = (await stat(fp)).size;
    const buf = await readFile(fp);
    const out = await sharp(buf)
      .resize({ width: MAX_W, withoutEnlargement: true })
      .png({ quality: 72, palette: true, compressionLevel: 9, effort: 8 })
      .toBuffer();
    // zapiš jen když je menší
    if (out.length < orig) {
      const tmp = fp + ".tmp";
      await writeFile(tmp, out);
      await rename(tmp, fp);
    }
    before += orig; after += Math.min(out.length, orig);
    console.log(`${file}: ${(orig / 1024).toFixed(0)} → ${(Math.min(out.length, orig) / 1024).toFixed(0)} KB`);
  } catch (e) {
    console.log(`${file}: SKIP (${e.message})`);
  }
}
console.log(`\nCelkem: ${(before / 1024).toFixed(0)} → ${(after / 1024).toFixed(0)} KB (úspora ${(100 - (after / before) * 100).toFixed(0)} %)`);
