// Odeslání e-mailu přes Resend. Bez RESEND_API_KEY je to no-op (nic se nestane),
// takže celý systém notifikací je bezpečné nasadit i bez klíče — rozjede se sám,
// jakmile klíč přidáš do Vercel env. (server-only)

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<{ ok: boolean; skipped?: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return { ok: false, skipped: true };
  const from = process.env.EMAIL_FROM || "TenisHub <info@tenishub.cz>";
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    return { ok: r.ok };
  } catch {
    return { ok: false };
  }
}

// Jednoduchá HTML šablona v barvách TenisHubu.
export function emailLayout(title: string, body: string, ctaText: string, ctaUrl: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#16110a">
    <div style="background:#2c4a3b;color:#fff;padding:16px 20px;border-radius:14px 14px 0 0;font-weight:800;font-size:18px">TENIS<span style="color:#bf9a47">HUB</span></div>
    <div style="border:1px solid #e7e2d6;border-top:0;border-radius:0 0 14px 14px;padding:22px 20px">
      <h2 style="margin:0 0 10px;font-size:19px">${title}</h2>
      <p style="margin:0 0 18px;line-height:1.55;color:#3a4a40">${body}</p>
      <a href="${ctaUrl}" style="display:inline-block;background:#bf9a47;color:#fff;text-decoration:none;font-weight:700;padding:11px 18px;border-radius:10px">${ctaText}</a>
      <p style="margin:20px 0 0;font-size:12px;color:#9aa3ad">TenisHub — celý český tenis na jednom místě. Tento e-mail vám přišel, protože máte účet na tenishub.cz.</p>
    </div>
  </div>`;
}
