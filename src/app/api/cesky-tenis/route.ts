import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Stáhne veřejný profil hráče z cesky-tenis.cz a vytáhne jméno, ročník, klub a žebříček.
   Vše je server-rendered HTML (žádné API) → parsujeme z textu, best-effort.
   POZOR: běží na serveru (Vercel). Lokálně může být síť blokovaná. */

function toText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const raw = sp.get("url") || "";
  let id = sp.get("id") || "";
  if (!id && raw) id = raw.match(/hrac\/(\d+)/)?.[1] ?? "";
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Zadej platný odkaz na profil z cesky-tenis.cz nebo číslo hráče." }, { status: 400 });
  }
  const year = sp.get("year") || raw.match(/[?&]year=([^&]+)/)?.[1] || "";
  const category = sp.get("category") || raw.match(/[?&]category=([^&]+)/)?.[1] || "";
  const qs = [year && `year=${encodeURIComponent(year)}`, category && `category=${encodeURIComponent(category)}`].filter(Boolean).join("&");
  const target = `https://cesky-tenis.cz/hrac/${id}${qs ? `?${qs}` : ""}`;

  let html = "";
  try {
    const r = await fetch(target, { headers: { "user-agent": "Mozilla/5.0 (compatible; TenisHub/1.0; +https://tenishub.cz)" }, cache: "no-store" });
    if (!r.ok) return NextResponse.json({ error: `Profil se nepodařilo načíst (HTTP ${r.status}).` }, { status: 502 });
    html = await r.text();
  } catch {
    return NextResponse.json({ error: "Spojení s cesky-tenis.cz selhalo." }, { status: 502 });
  }

  const text = toText(html);
  const titleRaw = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
  const titleName = titleRaw.split(/[-|–—]/)[0].trim();
  const name = titleName && !/tenis|žebříč|profil/i.test(titleName) ? titleName : null;

  const ranking =
    text.match(/Žebříček\s+(\d{1,6})/)?.[1] ??
    text.match(/(\d{1,6})\s+BH\b/)?.[1] ?? null;

  const birth =
    text.match(/Ročník[:\s]*([12]\d{3})/)?.[1] ??
    text.match(/nar(?:ozen[íy])?[.:\s]*([12]\d{3})/i)?.[1] ?? null;

  const club = text.match(/((?:TJ|TK|LTC|SK|HET|I\.\s?ČLTK|ČLTK|Tenisový|Tenis)\b[^,;|]{2,45})/)?.[1]?.trim() ?? null;

  return NextResponse.json({
    id, name, ranking: ranking ? Number(ranking) : null,
    birth_year: birth ? Number(birth) : null, club, year, category, source: target,
  });
}
