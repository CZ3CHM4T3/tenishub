"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Tlačítka v liště podle stavu přihlášení.
export function AuthNav() {
  const [logged, setLogged] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLogged(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setLogged(!!session?.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (logged) {
    return (
      <>
        <Link href="/ucet" className="login">Můj účet</Link>
        <Link href="/ucet" className="btn btn-gold">HUB+</Link>
      </>
    );
  }
  return (
    <>
      <Link href="/prihlaseni" className="login">Přihlásit se</Link>
      <Link href="/prihlaseni?tab=reg" className="btn btn-gold">Vstoupit zdarma</Link>
    </>
  );
}
