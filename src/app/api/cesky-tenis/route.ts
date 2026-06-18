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

  // VYHLEDÁVÁNÍ HRÁČE PODLE JMÉNA → /vyhledavani?q=
  const searchQ = sp.get("search");
  if (searchQ != null) {
    const q = searchQ.trim();
    if (q.length < 3) return NextResponse.json({ results: [] });
    try {
      const rr = await fetch(`https://cesky-tenis.cz/vyhledavani?q=${encodeURIComponent(q)}`, {
        headers: { "user-agent": "Mozilla/5.0 (compatible; TenisHub/1.0; +https://tenishub.cz)" },
        cache: "no-store", signal: AbortSignal.timeout(7000),
      });
      if (!rr.ok) return NextResponse.json({ error: `Hledání selhalo (HTTP ${rr.status}).` }, { status: 502 });
      return NextResponse.json({ results: parsePlayerSearch(await rr.text()) });
    } catch {
      return NextResponse.json({ error: "Spojení s cesky-tenis.cz selhalo." }, { status: 502 });
    }
  }

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
    text.match(/Narozen[íy]?\s+([12]\d{3})/i)?.[1] ??
    text.match(/Ročník[:\s]*([12]\d{3})/)?.[1] ?? null;

  const club = text.match(/Klub\s+([A-ZÁ-Ž][^|]{2,45}?)\s+Sezóna/)?.[1]?.trim() ?? null;

  const matches = parseMatches(text, name);

  // AUTO-OBJEVENÍ soutěží družstev z profilu (odkazy /soutez/{id}) → rozpis (termíny) zápasů
  const soutIds = [...new Set([...html.matchAll(/\/soutez\/(\d+)/g)].map((m) => m[1]))].slice(0, 5);
  let fixtures: ParsedFixture[] = [];
  if (club && soutIds.length) {
    const lists = await Promise.all(soutIds.map(async (sid) => {
      try {
        const rr = await fetch(`https://cesky-tenis.cz/soutez/${sid}`, {
          headers: { "user-agent": "Mozilla/5.0 (compatible; TenisHub/1.0; +https://tenishub.cz)" },
          cache: "no-store", signal: AbortSignal.timeout(7000),
        });
        if (!rr.ok) return [];
        return parseFixtures(await rr.text(), sid, club);
      } catch { return []; }
    }));
    const seen = new Set<string>();
    fixtures = lists.flat().filter((f) => !seen.has(f.extId) && seen.add(f.extId));
  }

  const body: Record<string, unknown> = {
    id, name, ranking: ranking ? Number(ranking) : null,
    birth_year: birth ? Number(birth) : null, club, year, category, source: target, matches, fixtures,
  };
  if (sp.get("debug")) { body.sample = text.slice(0, 2500); body.soutIds = soutIds; }
  return NextResponse.json(body);
}

type ParsedFixture = { extId: string; date: string; opponent: string; homeAway: "doma" | "venku" };

type SearchHit = { id: string; name: string; birth_year: number | null; club: string | null };

function parsePlayerSearch(html: string): SearchHit[] {
  const out: SearchHit[] = [];
  try {
    const aRe = /<a[^>]*href="\/hrac\/(\d+)"[^>]*>([\s\S]*?)<\/a>/g;
    const seen = new Set<string>();
    for (const m of html.matchAll(aRe)) {
      const id = m[1];
      const name = stripTags(m[2]);
      if (!name || seen.has(id)) continue;
      seen.add(id);
      // za jménem v řádku bývá: <rok> <klub> <platnost DD.MM.YYYY>
      const after = stripTags(html.slice(m.index! + m[0].length, m.index! + m[0].length + 220));
      const rc = after.match(/((?:19|20)\d{2})\s+(.+?)\s+\d{1,2}\.\d{1,2}\.\d{4}/);
      out.push({ id, name, birth_year: rc ? Number(rc[1]) : null, club: rc ? rc[2].trim() : null });
      if (out.length >= 20) break;
    }
  } catch { /* best-effort */ }
  return out;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&#?\w+;/g, " ").replace(/\s+/g, " ").trim();
}

function parseFixtures(html: string, soutId: string, clubName: string): ParsedFixture[] {
  const out: ParsedFixture[] = [];
  try {
    const clubKey = clubName.toLowerCase().trim();
    if (!clubKey) return out;
    // dvojice odkazů na týmy se stejným ?zapas=N (domácí, hosté)
    const aRe = new RegExp(`<a[^>]*href="\\/soutez\\/${soutId}\\?zapas=(\\d+)"[^>]*>([\\s\\S]*?)<\\/a>`, "g");
    const anchors = [...html.matchAll(aRe)].map((m) => ({ n: m[1], team: stripTags(m[2]), i: m.index! })).filter((a) => a.team);
    const dRe = /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/g;
    const dates = [...html.matchAll(dRe)].map((m) => ({ i: m.index!, d: `${m[3]}-${pad(m[2])}-${pad(m[1])}` }));
    const dateBefore = (pos: number) => { let r: string | null = null; for (const x of dates) { if (x.i < pos) r = x.d; else break; } return r; };
    const byN: Record<string, { n: string; team: string; i: number }[]> = {};
    for (const a of anchors) (byN[a.n] ??= []).push(a);
    for (const n of Object.keys(byN)) {
      const arr = byN[n]; if (arr.length < 2) continue;
      const home = arr[0].team, away = arr[1].team;
      const mineHome = home.toLowerCase().includes(clubKey), mineAway = away.toLowerCase().includes(clubKey);
      if (!mineHome && !mineAway) continue;
      const opponent = mineHome ? away : home;
      if (/^volno$/i.test(opponent.trim())) continue; // bye (volný los) → nepřidávat
      const date = dateBefore(arr[0].i); if (!date) continue;
      out.push({ extId: `ctf:${soutId}-${n}`, date, opponent, homeAway: mineHome ? "doma" : "venku" });
    }
  } catch { /* best-effort */ }
  return out;
}

type ParsedMatch = { extId: string; date: string; competition: string | null; opponent: string; score: string; sets: { me: number; opp: number }[]; win: boolean };

const pad = (s: string) => s.padStart(2, "0");
// jméno = 1–3 slova začínající velkým písmenem (vč. diakritiky)
const N = "\\p{Lu}[\\p{L}.'’-]+(?:\\s+\\p{Lu}[\\p{L}.'’-]+){0,2}";

function parseMatches(text: string, playerName: string | null): ParsedMatch[] {
  const out: ParsedMatch[] = [];
  try {
    // pozice dat v textu (DD. M. YYYY) pro přiřazení data k zápasu
    const dateRe = /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/g;
    const dates: { i: number; d: string }[] = [];
    for (const m of text.matchAll(dateRe)) dates.push({ i: m.index!, d: `${m[3]}-${pad(m[2])}-${pad(m[1])}` });
    const dateBefore = (pos: number) => { let r: string | null = null; for (const x of dates) { if (x.i < pos) r = x.d; else break; } return r; };

    // reálný formát: "Dvouhra <Já> <g g> <Soupeř> <g g> Ziskané body"
    const re = new RegExp(`Dvouhra\\s+(${N})\\s+(\\d+(?:\\s+\\d+){0,2})\\s+(${N})\\s+(\\d+(?:\\s+\\d+){0,2})\\s+Z[ií]skan`, "gu");
    const seen = new Set<string>();
    for (const m of text.matchAll(re)) {
      const opponent = m[3].trim();
      const myG = m[2].trim().split(/\s+/).map(Number);
      const opG = m[4].trim().split(/\s+/).map(Number);
      const n = Math.min(myG.length, opG.length);
      const sets = Array.from({ length: n }, (_, i) => ({ me: myG[i], opp: opG[i] })).filter((s) => s.me || s.opp);
      if (!sets.length) continue;
      const date = dateBefore(m.index!) || "";
      if (!date) continue;
      const win = sets.filter((s) => s.me > s.opp).length > sets.filter((s) => s.opp > s.me).length;
      const score = sets.map((s) => `${s.me}:${s.opp}`).join(" ");
      const extId = `ct:${date}|${opponent.toLowerCase()}|${score}`;
      if (seen.has(extId)) continue; seen.add(extId);
      out.push({ extId, date, competition: null, opponent, score, sets, win });
    }
  } catch { /* best-effort */ }
  return out.slice(0, 80);
}
