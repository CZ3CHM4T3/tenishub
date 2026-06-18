"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Me = { id: string; name: string } | null;
export type MeState = { me: Me; canPost: boolean; isAdmin: boolean; ready: boolean };

// Sdílené: kdo je přihlášený, má aktivní HUB+ (canPost), je admin.
export function useMe(): MeState {
  const [s, setS] = useState<MeState>({ me: null, canPost: false, isAdmin: false, ready: false });
  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setS({ me: null, canPost: false, isAdmin: false, ready: true }); return; }
      const [prof, mem] = await Promise.all([
        sb.from("profiles").select("full_name,email,is_admin").eq("id", user.id).maybeSingle(),
        sb.from("memberships").select("id").eq("profile_id", user.id).eq("status", "active").gt("expires_at", new Date().toISOString()).limit(1).maybeSingle(),
      ]);
      const isAdmin = prof.data?.is_admin === true;
      setS({ me: { id: user.id, name: prof.data?.full_name || prof.data?.email || "Člen" }, canPost: !!mem.data || isAdmin, isAdmin, ready: true });
    })();
  }, []);
  return s;
}
