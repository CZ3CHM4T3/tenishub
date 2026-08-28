import { NextResponse } from "next/server";
import { createClient as createSSR } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Aktivace 7denního zkušebního členství ZDARMA bez karty. Jen jednou na účet.
export async function POST() {
  const ssr = await createSSR();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nepřihlášený uživatel." }, { status: 401 });

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: existing } = await admin.from("memberships").select("id").eq("profile_id", user.id).limit(1);
  if (existing && existing.length) {
    return NextResponse.json({ error: "Zkušební období už bylo využité (nebo už členství máš)." }, { status: 400 });
  }

  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 86400000);
  const { error } = await admin.from("memberships").insert({
    profile_id: user.id, plan: "hub_plus", status: "active",
    started_at: now.toISOString(), expires_at: expires.toISOString(),
    price_czk: 0, auto_renew: false,
  });
  if (error) return NextResponse.json({ error: "Aktivace selhala: " + error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
