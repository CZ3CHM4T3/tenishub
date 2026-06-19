import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, emailLayout } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pošle e-mail upozornění (odpověď v poradně / odpověď ve fóru / nová zpráva).
// Volá se z webu po akci (fire-and-forget). Bez RESEND_API_KEY nebo SERVICE_ROLE
// jen tiše nic neudělá. Příjemce se dohledává v DB (caller ho neurčuje) → bezpečné.

const base = () => process.env.NEXT_PUBLIC_SITE_URL || "https://tenishub.cz";

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon) return NextResponse.json({ skipped: "config" });

  // ověř volajícího (musí být přihlášený)
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ skipped: "noauth" }, { status: 401 });
  const asUser = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: { user } } = await asUser.auth.getUser();
  if (!user) return NextResponse.json({ skipped: "noauth" }, { status: 401 });

  if (!service) return NextResponse.json({ skipped: "no-service-key" }); // bez service-role neumíme dohledat e-mail
  const admin = createClient(url, service, { auth: { persistSession: false } });

  let kind = "", id = "";
  try { const b = await req.json(); kind = b.kind; id = b.id; } catch { return NextResponse.json({ error: "bad body" }, { status: 400 }); }

  const emailOf = async (uid: string | null): Promise<{ email: string; name: string } | null> => {
    if (!uid) return null;
    const { data } = await admin.from("profiles").select("email,full_name").eq("id", uid).maybeSingle();
    if (!data?.email) return null;
    return { email: data.email as string, name: (data.full_name as string) || "" };
  };

  try {
    if (kind === "advice_answer") {
      const { data: q } = await admin.from("advice").select("author_id,notified_at,answer").eq("id", id).maybeSingle();
      if (!q || q.notified_at || !q.answer) return NextResponse.json({ skipped: "done" });
      const rec = await emailOf(q.author_id as string | null);
      if (rec) {
        const html = emailLayout("Vaše otázka v poradně byla zodpovězena", "Odborník odpověděl na váš dotaz v rodičovské poradně TenisHub.", "Zobrazit odpověď", `${base()}/poradna`);
        await sendEmail({ to: rec.email, subject: "Odpověď v poradně — TenisHub", html });
      }
      await admin.from("advice").update({ notified_at: new Date().toISOString() }).eq("id", id);
      return NextResponse.json({ ok: true });
    }

    if (kind === "forum_reply") {
      const { data: post } = await admin.from("forum_posts").select("thread_id,author_id,notified_at").eq("id", id).maybeSingle();
      if (!post || post.notified_at) return NextResponse.json({ skipped: "done" });
      const { data: th } = await admin.from("forum_threads").select("author_id,title").eq("id", post.thread_id).maybeSingle();
      if (th && th.author_id && th.author_id !== post.author_id) {
        const rec = await emailOf(th.author_id as string);
        if (rec) {
          const html = emailLayout("Nová odpověď ve vašem tématu", `Někdo reagoval na vaše téma „${(th.title as string) || ""}" ve fóru rodičů.`, "Zobrazit diskuzi", `${base()}/forum/${post.thread_id}`);
          await sendEmail({ to: rec.email, subject: "Nová odpověď ve fóru — TenisHub", html });
        }
      }
      await admin.from("forum_posts").update({ notified_at: new Date().toISOString() }).eq("id", id);
      return NextResponse.json({ ok: true });
    }

    if (kind === "message") {
      const { data: m } = await admin.from("messages").select("to_id,from_name,notified_at").eq("id", id).maybeSingle();
      if (!m || m.notified_at) return NextResponse.json({ skipped: "done" });
      const rec = await emailOf(m.to_id as string | null);
      if (rec) {
        const html = emailLayout("Máte novou zprávu", `${(m.from_name as string) || "Někdo"} vám napsal na TenisHubu.`, "Otevřít zprávy", `${base()}/zpravy`);
        await sendEmail({ to: rec.email, subject: "Nová zpráva — TenisHub", html });
      }
      await admin.from("messages").update({ notified_at: new Date().toISOString() }).eq("id", id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "unknown kind" }, { status: 400 });
  } catch {
    return NextResponse.json({ skipped: "error" });
  }
}
