import { createClient as createAdmin } from "@supabase/supabase-js";
import { getPaymentState } from "@/lib/barion";
import { SUPPLIER } from "@/lib/invoiceSupplier";

export const runtime = "nodejs";

const PLAN_ITEM: Record<string, string> = {
  hub_plus: "Členství HUB+ (1 měsíc)",
  trener_plus: "Členství TRENÉR+ (1 měsíc)",
  expert_plus: "Členství EXPERT+ (1 měsíc)",
};

// Barion po zaplacení zavolá tuhle URL s ?paymentId=... Ověříme stav a aktivujeme členství + fakturu.
async function handle(paymentId: string | null) {
  if (!paymentId) return;
  const state = await getPaymentState(paymentId);
  if (state.Status !== "Succeeded") return;

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: pay } = await admin.from("payments").select("*").eq("barion_payment_id", paymentId).maybeSingle();
  if (!pay || pay.status === "paid") return; // idempotentní — nezpracovat dvakrát

  const now = new Date();
  await admin.from("payments").update({ status: "paid", paid_at: now.toISOString() }).eq("id", pay.id);

  // Aktivace / prodloužení členství
  const expires = new Date(now.getTime() + (pay.months || 1) * 30 * 86400000);
  await admin.from("memberships").insert({
    profile_id: pay.profile_id, plan: pay.plan, status: "active",
    started_at: now.toISOString(), expires_at: expires.toISOString(),
    price_czk: pay.amount_czk, auto_renew: false,
  });

  // Faktura (vlastní číselná řada)
  const { data: prof } = await admin.from("profiles").select("full_name,email").eq("id", pay.profile_id).maybeSingle();
  const { data: number } = await admin.rpc("next_invoice_number", { p_year: now.getFullYear(), p_prefix: SUPPLIER.prefix });
  await admin.from("invoices").insert({
    number, profile_id: pay.profile_id,
    customer_name: (prof as { full_name?: string } | null)?.full_name ?? null,
    customer_email: (prof as { email?: string } | null)?.email ?? null,
    item: PLAN_ITEM[pay.plan] ?? "Členství", amount_czk: pay.amount_czk, vat_rate: SUPPLIER.vatRate, payment_id: pay.id,
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  await handle(url.searchParams.get("paymentId"));
  return new Response("OK");
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  let pid = url.searchParams.get("paymentId");
  if (!pid) { try { const b = await req.json(); pid = b.PaymentId || b.paymentId || null; } catch { /* */ } }
  await handle(pid);
  return new Response("OK");
}
