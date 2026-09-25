"use client";

// Mobilní spodní lišta pro PŘIHLÁŠENÉ — stupidně jednoduché ovládání na dosah palce.
// 4 ikony: Služby (rozcestník) · Profil · Zprávy · Víc (⋯ = Členství/O nás/Admin/Odhlásit).
// Globální (i na titulce), jen na mobilu; desktop používá horní lištu.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutGrid, UserRound, Mail, MoreHorizontal, BadgeCheck, Info, ShieldCheck, LogOut, X } from "lucide-react";

export function MemberBar() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [logged, setLogged] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unread, setUnread] = useState(0);
  const [more, setMore] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLogged(false); return; }
        setLogged(true);
        const { data: prof } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
        setIsAdmin(prof?.is_admin === true);
        try { const un = await supabase.from("messages").select("id", { count: "exact", head: true }).eq("to_id", user.id).is("read_at", null); setUnread(un.count ?? 0); } catch { /* */ }
      } catch { /* */ }
    })();
  }, [supabase]);

  useEffect(() => { setMore(false); }, [pathname]);
  useEffect(() => {
    if (logged) document.body.classList.add("has-mobar");
    return () => document.body.classList.remove("has-mobar");
  }, [logged]);

  const logout = async () => { await supabase.auth.signOut(); router.push("/"); };
  if (!logged) return null;
  const act = (p: string) => pathname.startsWith(p);

  return (
    <>
      {more && (
        <div className="mobar-sheet-ov" onClick={() => setMore(false)}>
          <div className="mobar-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="mobar-sheet-x" onClick={() => setMore(false)} aria-label="Zavřít"><X size={18} /></button>
            <Link href="/clenstvi" className="mobar-sheet-item"><BadgeCheck size={18} /> Členství</Link>
            <Link href="/o-nas" className="mobar-sheet-item"><Info size={18} /> O nás</Link>
            {isAdmin && <Link href="/admin" className="mobar-sheet-item"><ShieldCheck size={18} /> Administrace</Link>}
            <button className="mobar-sheet-item mobar-logout" onClick={logout}><LogOut size={18} /> Odhlásit se</button>
          </div>
        </div>
      )}
      <nav className="mobar" aria-label="Menu člena">
        <Link href="/sluzby" className={`mobar-i${act("/sluzby") || act("/domu") ? " on" : ""}`}><LayoutGrid size={22} /><span>Služby</span></Link>
        <Link href="/ucet?tab=profil" className={`mobar-i${act("/ucet") ? " on" : ""}`}><UserRound size={22} /><span>Profil</span></Link>
        <Link href="/zpravy" className={`mobar-i${act("/zpravy") ? " on" : ""}`}><span className="mobar-badge-wrap"><Mail size={22} />{unread > 0 && <span className="mobar-badge">{unread}</span>}</span><span>Zprávy</span></Link>
        <button type="button" className={`mobar-i${more ? " on" : ""}`} onClick={() => setMore((v) => !v)}><MoreHorizontal size={22} /><span>Víc</span></button>
      </nav>
    </>
  );
}
