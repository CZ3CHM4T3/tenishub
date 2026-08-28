"use client";

// Navigace v HOMEPAGE liště, login-aware:
//  - přihlášený → jeho barevné role-záložky (stejné jako na podstránkách přes SiteHeader)
//  - odhlášený → marketingové menu (Pro koho / Mapa / Členství / O nás)
// Řeší nekonzistenci: dřív homepage ukazovala marketingové menu i přihlášenému.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getViewAs } from "@/lib/viewAs";
import { isHiddenRole } from "@/lib/simplify";
import { tabsForRoles, type NavTab } from "@/lib/navtabs";

const MARKETING: [string, string, string][] = [
  ["rodic", "Rodič & dítě", "najít, sledovat, poradit"],
  ["trener", "Trenér", "vlastní klub & svěřenci"],
  ["sparring", "Sparring partner", "najdi s kým hrát"],
];

export function HomeRoleNav() {
  const [ready, setReady] = useState(false);
  const [tabs, setTabs] = useState<NavTab[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) { setTabs([]); return; }
        const { data: prof } = await sb.from("profiles").select("is_admin,is_coach,roles").eq("id", user.id).maybeSingle();
        const admin = prof?.is_admin === true;
        let roles: string[] = Array.isArray(prof?.roles) && (prof!.roles as string[]).length ? (prof!.roles as string[]) : (prof?.is_coach ? ["trener"] : ["rodic"]);
        let previewRole = false;
        if (admin) {
          const v = getViewAs();
          if (v === "navstevnik") { setTabs([]); return; }
          if (v !== "admin") { roles = [v]; previewRole = true; }
        }
        if (!previewRole) roles = roles.filter((r) => !isHiddenRole(r) || r === "vyplet");
        setTabs(tabsForRoles(roles.length ? roles : ["rodic"]));
      } catch { /* při chybě necháme marketingové menu */ }
      finally { setReady(true); }
    })();
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest(".nav-item")) setOpenMenu(null); };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  // Přihlášený → barevné role-záložky
  if (ready && tabs.length > 0) {
    return (
      <nav className="menu shmenu">
        {tabs.map((t) => (
          <Link key={t.label} className={`shtab shtab-${t.accent}`} href={t.href!}>
            {t.accent === "najdi" ? <span className="shtab-najdi-ic"><Search size={15} /><t.Icon size={16} /></span> : <t.Icon size={16} />} {t.label}
          </Link>
        ))}
      </nav>
    );
  }

  // Odhlášený (nebo dokud nevíme) → marketingové menu
  return (
    <nav className="menu">
      <div className="nav-item">
        <button className={`nav-link${openMenu === "koho" ? " open" : ""}`} type="button" onClick={() => setOpenMenu((m) => (m === "koho" ? null : "koho"))}>Pro koho <ChevronDown size={15} /></button>
        <div className={`drop${openMenu === "koho" ? " open" : ""}`}><div className="drop-inner">
          {MARKETING.filter(([k]) => !isHiddenRole(k)).map(([k, t, s]) => (
            <Link key={k} className="drop-card" href={k === "trener" ? "/pro-trenery" : k === "rodic" ? "/rodic" : `/pro-koho?role=${k}`}><b>{t}</b><span>{s}</span></Link>
          ))}
        </div></div>
      </div>
      <Link className="nav-link" href="/mapa">Mapa služeb</Link>
      <Link className="nav-link" href="/clenstvi">Členství</Link>
      <Link className="nav-link" href="/o-nas">O nás</Link>
    </nav>
  );
}
