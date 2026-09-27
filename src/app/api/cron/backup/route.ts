import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Denní ZÁLOHA databáze + KEEP-ALIVE v jednom (spouští Vercel Cron, viz vercel.json).
// - Stáhne všechny veřejné tabulky (tím zároveň „ťukne" do Supabase → neuspí se).
// - Uloží JSON snapshot do privátního Storage bucketu `backups`:
//     latest.json          … vždy přepsán (poslední stav)
//     RRRR-MM-DD.json       … denní archiv
// - Smaže archivy starší než 7 dní (drží se klouzavý poslední týden).
// Zabezpečeno přes CRON_SECRET. POTŘEBUJE env: SUPABASE_SERVICE_ROLE_KEY (+ CRON_SECRET).

const BUCKET = "backups";
const KEEP_DAYS = 7;

// Záložní seznam tabulek, kdyby introspekce PostgREST selhala.
const FALLBACK_TABLES = [
  "advice", "article_comments", "article_likes", "articles", "availability", "bazar_listings",
  "bookings", "calendar_events", "cesta_events", "cesta_goals", "cesta_phases", "cesta_players",
  "cesta_settings", "cesta_types", "cesta_zapasy", "claim_requests", "coach_events", "coach_groups",
  "coach_invites", "coach_kurikulum", "coach_posts", "coach_roster", "contact_messages", "courts",
  "deti", "event_rsvp", "events", "feedback", "forum_posts", "forum_threads", "invoice_counter",
  "invoices", "memberships", "messages", "odemceno", "payments", "profiles", "provider_outreach",
  "removal_requests", "reviews", "services", "sparring_offers", "specialists", "tournaments",
  "venues", "video_requests", "waitlist", "zapasy", "zdroje",
];

function ymd(d: Date) { return d.toISOString().slice(0, 10); }

export async function GET(req: NextRequest) {
  // Vercel Cron posílá Authorization: Bearer <CRON_SECRET>; ruční test i přes ?key=<CRON_SECRET>.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const okHeader = req.headers.get("authorization") === `Bearer ${secret}`;
    const okQuery = new URL(req.url).searchParams.get("key") === secret;
    if (!okHeader && !okQuery) return NextResponse.json({ error: "Neautorizováno." }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    return NextResponse.json({ error: "Chybí SUPABASE_SERVICE_ROLE_KEY (nastav v env na Vercelu)." }, { status: 500 });
  }
  const admin = createClient(url, service, { auth: { persistSession: false } });

  // Bucket zajistíme (privátní). Když už je, chybu ignorujeme.
  await admin.storage.createBucket(BUCKET, { public: false }).catch(() => {});

  // Seznam tabulek z OpenAPI (definitions) — automaticky drží krok s DB; fallback níže.
  let tables: string[] = [];
  try {
    const spec = await (await fetch(`${url}/rest/v1/`, {
      headers: { apikey: service, authorization: `Bearer ${service}` }, cache: "no-store",
    })).json();
    tables = Object.keys(spec?.definitions ?? {});
  } catch { /* fallback */ }
  if (!tables.length) tables = FALLBACK_TABLES;

  // Export: každou tabulku stáhneme (zároveň keep-alive). Chyby přeskočíme.
  const snapshot: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};
  const skipped: string[] = [];
  let totalRows = 0;
  for (const t of tables) {
    const { data, error } = await admin.from(t).select("*").limit(100000);
    if (error) { skipped.push(t); continue; }
    snapshot[t] = data ?? [];
    counts[t] = data?.length ?? 0;
    totalRows += counts[t];
  }

  const today = ymd(new Date());
  const payload = JSON.stringify({ generated_at: new Date().toISOString(), counts, tables: snapshot });
  const body = new Blob([payload], { type: "application/json" });

  // latest.json (přepis) + denní archiv
  const up1 = await admin.storage.from(BUCKET).upload("latest.json", body, { contentType: "application/json", upsert: true });
  const up2 = await admin.storage.from(BUCKET).upload(`${today}.json`, body, { contentType: "application/json", upsert: true });

  // Prune: smaž archivy starší než KEEP_DAYS (jen RRRR-MM-DD.json; latest.json necháme).
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
  const cutoffStr = ymd(cutoff);
  const pruned: string[] = [];
  const { data: files } = await admin.storage.from(BUCKET).list("", { limit: 1000 });
  const old = (files ?? [])
    .map((f) => f.name)
    .filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n) && n.slice(0, 10) < cutoffStr);
  if (old.length) { await admin.storage.from(BUCKET).remove(old); pruned.push(...old); }

  return NextResponse.json({
    ok: !up1.error && !up2.error,
    date: today,
    tables: Object.keys(snapshot).length,
    rows: totalRows,
    skipped,
    pruned,
    uploadError: up1.error?.message || up2.error?.message || null,
  });
}
