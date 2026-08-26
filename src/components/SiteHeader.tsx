"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isHiddenRole } from "@/lib/simplify";
import { ChevronDown, Mail, ShieldCheck, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getViewAs } from "@/lib/viewAs";
import { tabsForRoles, type NavTab } from "@/lib/navtabs";

const MARKETING_ROLES: [string, string, string][] = [
  ["rodic", "Rodič & dítě", "najít, sledovat, poradit"],
  ["hrac", "Hráč", "hraj, zlepšuj se, sparring"],
  ["trener", "Trenér", "klienti & nástroje"],
  ["sparring", "Sparring partner", "najdi s kým hrát"],
  ["areal", "Areály & kluby", "obsazenost kurtů"],
  ["fyzio", "Fyzio", "klienti z tenisu"],
  ["fitness", "Fitness", "kondiční příprava"],
  ["vyplet", "Vyplétač", "servis raket"],
];

// Sdílená lišta. Odhlášený = marketingové menu; přihlášený = záložky podle rolí.
export function SiteHeader() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [ready, setReady] = useState(false);
  const [logged, setLogged] = useState(false);
  const [tabs, setTabs] = useState<NavTab[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unread, setUnread] = useState(0);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setLogged(false); setReady(true); return; }
      const { data: prof } = await sb.from("profiles").select("is_admin,is_coach,roles").eq("id", user.id).maybeSingle();
      const admin = prof?.is_admin === true;
      let roles: string[] = Array.isArray(prof?.roles) && (prof!.roles as string[]).length ? (prof!.roles as string[]) : (prof?.is_coach ? ["trener"] : ["rodic"]);
      if (admin) {
        const v = getViewAs();
        if (v === "navstevnik") { setLogged(false); setReady(true); return; }
        if (v === "rodic") roles = ["rodic"];
        else if (v === "trener") roles = ["trener"];
      }
      roles = roles.filter((r) => !isHiddenRole(r) || r === "vyplet");
      setTabs(tabsForRoles(roles.length ? roles : ["rodic"]));
      setIsAdmin(admin);
      const un = await sb.from("messages").select("id", { count: "exact", head: true }).eq("to_id", user.id).is("read_at", null);
      setUnread(un.count ?? 0);
      setLogged(true);
      setReady(true);
    })();
  }, []);

  const logout = async () => { const sb = createClient(); await sb.auth.signOut(); router.push("/"); };

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest(".nav-item")) setOpenMenu(null); };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 120) setHidden(false);
      else if (y > lastY + 5) setHidden(true);
      else if (y < lastY - 5) setHidden(false);
      lastY = y;
    };
    const onMove = (e: MouseEvent) => { if (e.clientY < 72) setHidden(false); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("mousemove", onMove); };
  }, []);

  return (
    <header className={`shdr${hidden && !mobileOpen ? " shdr-hidden" : ""}`}>
      <div className="wrap">
        <div className="bar">
          <Link href="/" className="brand" aria-label="TenisHub">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-tenishub.png" alt="TenisHub" className="brand-img" />
          </Link>

          {/* NAV — marketing (odhlášený) nebo role-záložky (přihlášený) */}
          {ready && logged ? (
            <nav className="menu shmenu">
              {tabs.map((t) => (
                t.group ? (
                  <div className="nav-item" key={t.label}>
                    <button className={`shtab${openMenu === t.label ? " open" : ""}`} type="button" onClick={() => setOpenMenu((m) => (m === t.label ? null : t.label))}><t.Icon size={16} /> {t.label} <ChevronDown size={13} /></button>
                    <div className={`drop${openMenu === t.label ? " open" : ""}`}><div className="drop-inner">
                      {t.group.map((s) => <Link key={s.href} className="drop-card" href={s.href}><b>{s.label}</b></Link>)}
                    </div></div>
                  </div>
                ) : (
                  <Link key={t.label} className={`shtab${t.accent ? " shtab-" + t.accent : ""}`} href={t.href!}><t.Icon size={16} /> {t.label}</Link>
                )
              ))}
            </nav>
          ) : (
            <nav className="menu">
              <div className="nav-item">
                <button className={`nav-link${openMenu === "koho" ? " open" : ""}`} type="button" onClick={() => setOpenMenu((m) => (m === "koho" ? null : "koho"))}>Pro koho <ChevronDown size={15} /></button>
                <div className={`drop${openMenu === "koho" ? " open" : ""}`}><div className="drop-inner">
                  {MARKETING_ROLES.filter(([k]) => !isHiddenRole(k)).map(([k, t, s]) => (
                    <Link key={k} className="drop-card" href={k === "trener" ? "/pro-trenery" : k === "rodic" ? "/rodic" : `/pro-koho?role=${k}`}><b>{t}</b><span>{s}</span></Link>
                  ))}
                </div></div>
              </div>
              <Link className="nav-link" href="/mapa">Mapa služeb</Link>
              <Link className="nav-link" href="/clenstvi">Členství</Link>
              <Link className="nav-link" href="/o-nas">O nás</Link>
            </nav>
          )}

          <div className="nav-r">
            {ready && logged ? (
              <div className="shu">
                <Link href="/zpravy" className="shu-mail" aria-label="Zprávy" title="Zprávy"><Mail size={19} />{unread > 0 && <span className="authr-dot">{unread}</span>}</Link>
                {isAdmin && <Link href="/admin" className="shu-btn" aria-label="Administrace" title="Administrace"><ShieldCheck size={18} /></Link>}
                <button type="button" className="shu-btn" onClick={logout} aria-label="Odhlásit se" title="Odhlásit se"><LogOut size={18} /></button>
              </div>
            ) : ready ? (
              <Link href="/prihlaseni" className="btn btn-gold">Přihlásit se</Link>
            ) : null}
            <button className="burger" aria-label="Menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen((o) => !o)}>{mobileOpen ? "✕" : "☰"}</button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="mnav" onClick={() => setMobileOpen(false)}>
            {ready && logged ? (<>
              {tabs.flatMap((t) => t.group
                ? t.group.map((s) => <Link key={s.href} href={s.href}>{s.label}</Link>)
                : [<Link key={t.label} href={t.href!}>{t.label}</Link>])}
              <Link href="/zpravy">Zprávy{unread > 0 ? ` (${unread})` : ""}</Link>
              {isAdmin && <Link href="/admin">Administrace</Link>}
              <button type="button" className="mnav-logout" onClick={logout}>Odhlásit se</button>
            </>) : (<>
              <Link href="/rodic">Rodič &amp; dítě</Link>
              <Link href="/pro-trenery">Trenér</Link>
              <Link href="/mapa">Mapa služeb</Link>
              <Link href="/clenstvi">Členství</Link>
              <Link href="/o-nas">O nás</Link>
            </>)}
          </nav>
        )}
      </div>
    </header>
  );
}
