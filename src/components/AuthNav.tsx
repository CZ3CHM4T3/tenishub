"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight } from "lucide-react";

// Roh HOMEPAGE lišty: odhlášený = Přihlásit se; přihlášený = kolečko s iniciály,
// kterým se překlikne do členského menu (na /ucet, kde je lišta s rolemi).
export function AuthNav() {
  const [ready, setReady] = useState(false);
  const [logged, setLogged] = useState(false);
  const [name, setName] = useState("Účet");

  const loadMe = async () => {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setLogged(false); setReady(true); return; }
    setLogged(true);
    const { data: prof } = await sb.from("profiles").select("full_name,email").eq("id", user.id).maybeSingle();
    setName(prof?.full_name || prof?.email || "Účet");
    setReady(true);
  };

  useEffect(() => {
    loadMe();
    const sb = createClient();
    const { data: sub } = sb.auth.onAuthStateChange(() => loadMe());
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  if (!ready) return <span style={{ width: 70 }} />;
  if (!logged) return <Link href="/prihlaseni" className="btn btn-gold">Přihlásit se</Link>;

  const initial = (name || "?").trim().charAt(0).toUpperCase();

  return (
    <Link href="/domu" className="usermenu-btn" aria-label="Přejít do mého menu" title="Moje menu">
      <span className="usermenu-av">{initial}</span>
      <span className="usermenu-name">{name.split(" ")[0]}</span>
      <ArrowRight size={15} />
    </Link>
  );
}
