"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, Mail, Settings, UserRound, ShieldCheck, LogOut } from "lucide-react";

// Pravý roh lišty: obálka (zkratka do Zpráv + odznak nevyřízených) + kolečko profilu.
export function AuthNav() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [logged, setLogged] = useState(false);
  const [name, setName] = useState("Účet");
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
      sb.from("profiles").select("full_name,email,is_admin").eq("id", user.id).maybeSingle(),
      sb.from("messages").select("id", { count: "exact", head: true }).eq("to_id", user.id).is("read_at", null),
    ]);
    setName(prof.data?.full_name || prof.data?.email || "Účet");
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

  if (!ready) return <span style={{ width: 70 }} />;
  if (!logged) return <Link href="/prihlaseni" className="btn btn-gold">Přihlásit se</Link>;

  const initial = (name || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="authr" ref={ref}>
      <Link href="/zpravy" className="authr-mail" aria-label="Zprávy">
        <Mail size={19} />
        {unread > 0 && <span className="authr-dot">{unread}</span>}
      </Link>
      <button type="button" className="usermenu-btn" onClick={() => setOpen((o) => !o)}>
        <span className="usermenu-av">{initial}</span>
        <span className="usermenu-name">{name.split(" ")[0]}</span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="usermenu-drop" onClick={() => setOpen(false)}>
          <Link href="/ucet" className="um-item"><Settings size={16} /> Nastavení <span className="um-hint">role · profil</span></Link>
          <Link href="/ucet" className="um-item"><UserRound size={16} /> Můj účet</Link>
          {isAdmin && <Link href="/admin" className="um-item um-admin"><ShieldCheck size={16} /> Administrace</Link>}
          <button type="button" className="um-item um-logout" onClick={logout}><LogOut size={16} /> Odhlásit se</button>
        </div>
      )}
    </div>
  );
}
