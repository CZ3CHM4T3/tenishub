"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, UserRound, Mail, Route, Baby, GraduationCap, ShieldCheck, LogOut, Store } from "lucide-react";

// Uživatelské menu v liště — VŠECHNY funkce přihlášeného na jednom místě.
export function AuthNav() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [logged, setLogged] = useState(false);
  const [name, setName] = useState("Můj účet");
  const [isCoach, setIsCoach] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const loadMe = async () => {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setLogged(false); setReady(true); return; }
    setLogged(true);
    const [prof, un] = await Promise.all([
      sb.from("profiles").select("full_name,email,is_coach,is_admin").eq("id", user.id).maybeSingle(),
      sb.from("messages").select("id", { count: "exact", head: true }).eq("to_id", user.id).is("read_at", null),
    ]);
    setName(prof.data?.full_name || prof.data?.email || "Můj účet");
    setIsCoach(!!prof.data?.is_coach);
    setIsAdmin(!!prof.data?.is_admin);
    setUnread(un.count ?? 0);
    setReady(true);
  };

  useEffect(() => {
    loadMe();
    const sb = createClient();
    const { data: sub } = sb.auth.onAuthStateChange(() => loadMe());
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", h);
    return () => { sub.subscription.unsubscribe(); document.removeEventListener("click", h); };
  }, []);

  const logout = async () => {
    const sb = createClient();
    await sb.auth.signOut();
    setOpen(false);
    router.push("/");
  };

  if (!ready) return <span style={{ width: 90 }} />;

  if (!logged) {
    return <Link href="/prihlaseni" className="btn btn-gold">Přihlásit se</Link>;
  }

  const initial = (name || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="usermenu" ref={ref}>
      <button type="button" className="usermenu-btn" onClick={() => setOpen((o) => !o)}>
        <span className="usermenu-av">{initial}{unread > 0 && <span className="usermenu-dot" />}</span>
        <span className="usermenu-name">{name.split(" ")[0]}</span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="usermenu-drop" onClick={() => setOpen(false)}>
          <Link href="/ucet" className="um-item"><UserRound size={16} /> Můj účet</Link>
          <Link href="/zpravy" className="um-item"><Mail size={16} /> Zprávy{unread > 0 && <span className="um-badge">{unread}</span>}</Link>
          <Link href="/moje-cesta" className="um-item"><Route size={16} /> Moje cesta</Link>
          <Link href="/deti" className="um-item"><Baby size={16} /> Moje děti</Link>
          {isCoach && <Link href="/klub" className="um-item"><GraduationCap size={16} /> Můj klub</Link>}
          {isCoach && <Link href="/ucet?tab=karta" className="um-item"><Store size={16} /> Moje karta</Link>}
          {isAdmin && <Link href="/admin" className="um-item um-admin"><ShieldCheck size={16} /> Administrace</Link>}
          <button type="button" className="um-item um-logout" onClick={logout}><LogOut size={16} /> Odhlásit se</button>
        </div>
      )}
    </div>
  );
}
