"use client";

import { createClient } from "@/lib/supabase/client";

// Fire-and-forget upozornění (po akci). Bez klíče/konfigu jen tiše nic neudělá.
export async function notify(kind: "advice_answer" | "forum_reply" | "message", id: string) {
  try {
    const sb = createClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;
    await fetch("/api/notify", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ kind, id }),
    });
  } catch { /* notifikace nikdy nesmí rozbít akci */ }
}
