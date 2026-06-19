import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Naparsuje výpis turnajů jednotlivců z cesky-tenis.cz (např. /jednotlivci/dospeli?region=…).
// Řádek: "4.-6. 4. 2026 | C | 400 Kč | TK EMA o.s. | 3/4 | -/-" + odkazy /turnaj/{id}.
// Best-effort, běží jen nasazené. ?debug=1 vrací vzorek textu.

const pad = (s: string | number) => String(s).padStart(2, "0");

function toText(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&#?\w+;/g, " ").replace(/\s+/g, " ").trim();
}

type T = { extId: string; date: string; name: string; category: string | null; fee: string | null; url: string | null };

export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get("url") || "").trim();
  if (!/^https?:\/\/(www\.)?cesky-tenis\.cz\//.test(raw)) {
    return NextResponse.json({ error: "Vlož odkaz na výpis turnajů z cesky-tenis.cz (např. .../jednotlivci/dospeli?region=…)." }, { status: 400 });
  }
  let html = "";
  try {
    const r = await fetch(raw, { headers: { "user-agent": "Mozilla/5.0 (compatible; TenisHub/1.0; +https://tenishub.cz)" }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!r.ok) return NextResponse.json({ error: `Načtení selhalo (HTTP ${r.status}).` }, { status: 502 });
    html = await r.text();
  } catch { return NextResponse.json({ error: "Spojení s cesky-tenis.cz selhalo." }, { status: 502 }); }

  const text = toText(html);
  const ids = [...new Set([...html.matchAll(/\/turnaj\/(\d+)/g)].map((m) => m[1]))];
  const out: T[] = [];
  const seen = new Set<string>();
  // datum (i rozsah) + třída + vstupné + pořadatel (do losu \d/\d nebo -/-)
  const re = /(\d{1,2})\.\s*(?:-\s*\d{1,2}\.\s*)?(\d{1,2})\.\s*(\d{4})\s+(MČR|MCR|[A-EP])\s+(\d+)\s*Kč\s+(.+?)\s+(?:\d+\s*\/\s*\d+|-\s*\/\s*-)/gu;
  let i = 0;
  for (const m of text.matchAll(re)) {
    const date = `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
    const name = m[6].trim().replace(/\s+/g, " ").slice(0, 80);
    const id = ids[i];
    const extId = id ? `ctt:${id}` : `ctt:${date}|${name.toLowerCase().slice(0, 30)}`;
    i++;
    if (seen.has(extId)) continue; seen.add(extId);
    out.push({ extId, date, name, category: m[4], fee: m[5], url: id ? `https://cesky-tenis.cz/turnaj/${id}` : raw });
  }

  const body: Record<string, unknown> = { count: out.length, tournaments: out.slice(0, 120) };
  if (req.nextUrl.searchParams.get("debug")) body.sample = text.slice(0, 2500);
  return NextResponse.json(body);
}
