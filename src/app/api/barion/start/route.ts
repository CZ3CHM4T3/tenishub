import { NextResponse } from "next/server";
import { createClient as createSSR } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { startPayment, barionConfigured } from "@/lib/barion";

export const runtime = "nodejs";

// Plány k prodeji (částka + popis + počet měsíců).
const PLANS: Record<string, { price: number; item: string; months: number }> = {
  hub_plus: { price: 99, item: "Členství HUB+ (1 měsíc)", months: 1 },
  profi_plus: { price: 299, item: "Členství PROFI+ (1 měsíc)", months: 1 },
  trener_plus: { price: 299, item: "Členství PROFI+ (1 měsíc)", months: 1 },
  expert_plus: { price: 299, item: "Členství PROFI+ (1 měsíc)", months: 1 },
};

export async function POST(req: Request) {
  if (!barionConfigured()) return NextResponse.json({ error: "Platby zatím nejsou nastavené (chybí Barion klíče)." }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const plan = typeof body.plan === "string" && PLANS[body.plan] ? body.plan : "hub_plus";
  const cfg = PLANS[plan];

  const ssr = await createSSR();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nepřihlášený uživatel." }, { status: 401 });

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const prid = crypto.randomUUID();
  await admin.from("payments").insert({
    profile_id: user.id, plan, amount_czk: cfg.price, months: cfg.months,
    payment_request_id: prid, status: "pending",
  });

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://tenishub.cz";
  const start = await startPayment({
    amountCzk: cfg.price, item: cfg.item, paymentRequestId: prid,
    redirectUrl: `${site}/ucet?tab=clenstvi&paid=1`,
    callbackUrl: `${site}/api/barion/callback`,
  });

  if (!start.GatewayUrl || !start.PaymentId) {
    await admin.from("payments").update({ status: "failed" }).eq("payment_request_id", prid);
    return NextResponse.json({ error: start.Errors?.[0]?.Description || "Platbu se nepodařilo vytvořit." }, { status: 502 });
  }
  await admin.from("payments").update({ barion_payment_id: start.PaymentId }).eq("payment_request_id", prid);
  return NextResponse.json({ gatewayUrl: start.GatewayUrl });
}
