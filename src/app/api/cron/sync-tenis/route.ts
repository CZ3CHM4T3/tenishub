import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Denní automatický sync ze cesky-tenis.cz pro všechny napojené hráče (cts_id).
// Spouští Vercel Cron (viz vercel.json). Zabezpečeno přes CRON_SECRET (Vercel ho
// posílá jako Authorization: Bearer). Zápis přes service-role (obchází RLS).
// POTŘEBUJE env: SUPABASE_SERVICE_ROLE_KEY + (doporučeno) CRON_SECRET.

type Ev = { player_id: string; date: string; type: string; title: string; opponent: string; score: string | null; sets: unknown; win: boolean | null; ext_id: string };

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Neautorizováno." }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    return NextResponse.json({ error: "Chybí SUPABASE_SERVICE_ROLE_KEY (nastav v env na Vercelu)." }, { status: 500 });
  }
  const admin = createClient(url, service, { auth: { persistSession: false } });
  const origin = new URL(req.url).origin;

  const { data: players, error } = await admin.from("cesta_players").select("id,cts_id").not("cts_id", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let rankUpd = 0, evIns = 0, done = 0;
  for (const p of (players ?? []) as { id: string; cts_id: string }[]) {
    try {
      const d = await (await fetch(`${origin}/api/cesky-tenis?id=${encodeURIComponent(p.cts_id)}`, { cache: "no-store" })).json();
      if (d.ranking != null) { await admin.from("cesta_players").update({ ranking: d.ranking }).eq("id", p.id); rankUpd++; }

      const ex = await admin.from("cesta_events").select("ext_id").eq("player_id", p.id).not("ext_id", "is", null);
      const existing = new Set((ex.data ?? []).map((r: { ext_id: string }) => r.ext_id));
      const rows: Ev[] = [
        ...((d.matches ?? []) as { extId: string; date: string; opponent: string; score: string; sets: unknown; win: boolean }[])
          .filter((m) => !existing.has(m.extId))
          .map((m) => ({ player_id: p.id, date: m.date, type: "tournament", title: `vs ${m.opponent}`, opponent: m.opponent, score: m.score, sets: m.sets, win: m.win, ext_id: m.extId })),
        ...((d.fixtures ?? []) as { extId: string; date: string; opponent: string; homeAway: string }[])
          .filter((f) => !existing.has(f.extId))
          .map((f) => ({ player_id: p.id, date: f.date, type: "tournament", title: `Družstva (${f.homeAway}): ${f.opponent}`, opponent: f.opponent, score: null, sets: null, win: null, ext_id: f.extId })),
      ];
      if (rows.length) { await admin.from("cesta_events").insert(rows); evIns += rows.length; }
      done++;
    } catch { /* další hráč */ }
  }

  return NextResponse.json({ players: (players ?? []).length, synced: done, rankingUpdated: rankUpd, eventsInserted: evIns });
}
