import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkMessage } from "@/lib/moderace";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

// „Zeptejte se nás" — přijme dotaz, odfiltruje spam/boty, uloží do DB
// (admin čte v /admin) a pošle e-mail (když je nastavený Resend).
export async function POST(req: Request) {
  let data: Record<string, unknown>;
  try { data = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Špatný formát." }, { status: 400 }); }

  const name = String(data?.name ?? "").trim().slice(0, 120);
  const email = String(data?.email ?? "").trim().slice(0, 160);
  const body = String(data?.body ?? "");
  const honey = String(data?.website ?? ""); // honeypot — lidé ho nevidí

  if (honey) return NextResponse.json({ ok: true });            // bot → tváříme se OK, zahodíme
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return NextResponse.json({ ok: false, error: "Zkontrolujte prosím e-mail." }, { status: 400 });

  const mod = checkMessage(body);
  if (!mod.ok)
    return NextResponse.json({ ok: false, error: mod.reason === "spam" ? "Zpráva vypadá jako spam a nebyla odeslána." : mod.reason }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.json({ ok: false, error: "Momentálně nelze odeslat, zkuste to později." }, { status: 500 });

  const sb = createClient(url, anon);
  const { error } = await sb.from("contact_messages").insert({ name: name || null, email: email || null, body: body.trim() });
  if (error) return NextResponse.json({ ok: false, error: "Nepodařilo se odeslat, zkuste to prosím znovu." }, { status: 500 });

  const to = process.env.CONTACT_TO || "info@tenishub.cz";
  const safe = body.trim().replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string)).replace(/\n/g, "<br>");
  sendEmail({
    to,
    subject: `Nový dotaz z webu${name ? ` — ${name}` : ""}`,
    html: `<p><b>Od:</b> ${name || "—"} ${email ? `(${email})` : ""}</p><p>${safe}</p>`,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
