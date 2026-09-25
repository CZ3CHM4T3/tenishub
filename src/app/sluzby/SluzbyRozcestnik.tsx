"use client";

// Členský ROZCESTNÍK služeb — přistání po přihlášení. Barevné oddíly podle rolí:
// co máš k dispozici (aktivní) + co bys mohl mít (zamčené se štítkem HUB+/PROFI+/role).
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/client";
import { getViewAs } from "@/lib/viewAs";
import {
  Users, Handshake, GraduationCap, Baby, Route, Search, MessageCircle, BookOpen, Video,
  MapPin, Trophy, School, BadgeCheck, Lock, ArrowRight, type LucideIcon,
} from "lucide-react";

type Need = "free" | "hub" | "trener";
type Svc = { href: string; Icon: LucideIcon; t: string; need: Need; sub?: string };
type Section = { key: string; title: string; c: string; Icon: LucideIcon; items: Svc[] };

const SECTIONS: Section[] = [
  { key: "rodic", title: "Rodič & dítě", c: "#2f7d54", Icon: Users, items: [
    { href: "/ucet?tab=deti", Icon: Baby, t: "Moje děti", need: "free", sub: "profily, avatary, pokrok" },
    { href: "/moje-cesta", Icon: Route, t: "Moje cesta", need: "hub", sub: "celá sezóna dítěte" },
    { href: "/mapa", Icon: Search, t: "Najít trenéra", need: "free", sub: "mapa a katalog" },
    { href: "/poradna", Icon: MessageCircle, t: "Poradna", need: "hub", sub: "zeptej se odborníka" },
    { href: "/clanky", Icon: BookOpen, t: "Knihovna", need: "free", sub: "rady a návody" },
    { href: "/videorozbor", Icon: Video, t: "Videorozbor", need: "free", sub: "1:1 rozbor hry" },
  ] },
  { key: "hrac", title: "Hráč & sparring", c: "#3670a8", Icon: Handshake, items: [
    { href: "/sparring", Icon: Handshake, t: "Sparring", need: "free", sub: "najdi parťáka" },
    { href: "/mapa", Icon: MapPin, t: "Najít kurt / klub", need: "free", sub: "poblíž tebe" },
    { href: "/turnaje", Icon: Trophy, t: "Turnaje", need: "free", sub: "kalendář v okolí" },
  ] },
  { key: "trener", title: "Trenér / profík", c: "#b0862c", Icon: GraduationCap, items: [
    { href: "/klub", Icon: School, t: "Můj klub", need: "trener", sub: "svěřenci, nástroje" },
    { href: "/ucet?tab=profil", Icon: BadgeCheck, t: "Můj profil & renomé", need: "trener", sub: "veřejná karta" },
  ] },
];

export default function SluzbyRozcestnik() {
  const supabase = useMemo(() => createClient(), []);
  const [ready, setReady] = useState(false);
  const [logged, setLogged] = useState(false);
  const [hub, setHub] = useState(false);
  const [isTrener, setIsTrener] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLogged(false); return; }
        setLogged(true);
        const [{ data: prof }, { data: mem }] = await Promise.all([
          supabase.from("profiles").select("is_admin,is_coach,roles").eq("id", user.id).maybeSingle(),
          supabase.from("memberships").select("id").eq("profile_id", user.id).eq("status", "active").gt("expires_at", new Date().toISOString()).limit(1).maybeSingle(),
        ]);
        const admin = prof?.is_admin === true;
        const roles: string[] = Array.isArray(prof?.roles) ? (prof!.roles as string[]) : [];
        let trener = roles.includes("trener") || !!prof?.is_coach;
        let member = !!mem || admin;
        if (admin) { const v = getViewAs(); if (v === "rodic") { trener = false; member = true; } else if (v === "trener") { trener = true; member = false; } else if (v === "navstevnik") { setLogged(false); return; } }
        setHub(member); setIsTrener(trener);
      } catch { /* necháme jako nepřihlášený */ }
      finally { setReady(true); }
    })();
  }, [supabase]);

  const has = (n: Need) => n === "free" || (n === "hub" && hub) || (n === "trener" && isTrener);
  const lockLabel = (n: Need) => (n === "hub" ? "HUB+" : n === "trener" ? "Trenér" : "");
  const unlockHref = (n: Need) => (n === "hub" ? "/ucet?tab=clenstvi" : "/ucet?tab=profil");

  return (
    <div className="acct-page">
      <SiteHeader />
      <div className="wrap acct-wrap">
        <h1 className="acct-h1"><Route size={24} style={{ verticalAlign: "-4px" }} /> Vaše služby</h1>
        <p className="clanky-intro">Všechno na jednom místě. Co máš k dispozici je aktivní; zamčené si odemkneš členstvím nebo zapnutím role.</p>

        <div className="roz-sections">
          {SECTIONS.map((s) => {
            const sectionLocked = s.key === "trener" && !isTrener;
            return (
              <section className="roz-sec" key={s.key} style={{ ["--gc" as string]: s.c }}>
                <div className="roz-head"><span className="roz-head-ic"><s.Icon size={18} /></span> {s.title}
                  {sectionLocked && <Link href="/ucet?tab=profil" className="roz-enable">Zapnout roli →</Link>}
                </div>
                <div className="roz-grid">
                  {s.items.map((it) => {
                    const open = has(it.need);
                    if (open) {
                      return (
                        <Link href={it.href} className="roz-card" key={it.t}>
                          <span className="roz-ic"><it.Icon size={20} /></span>
                          <span className="roz-tx"><b>{it.t}</b>{it.sub && <span>{it.sub}</span>}</span>
                          <ArrowRight size={16} className="roz-arr" />
                        </Link>
                      );
                    }
                    return (
                      <Link href={unlockHref(it.need)} className="roz-card roz-locked" key={it.t}>
                        <span className="roz-ic"><it.Icon size={20} /></span>
                        <span className="roz-tx"><b>{it.t}</b>{it.sub && <span>{it.sub}</span>}</span>
                        <span className="roz-lock"><Lock size={12} /> {lockLabel(it.need)}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {ready && !logged && (
          <p className="member-note" style={{ textAlign: "center", marginTop: "1.4rem" }}>
            <Link href="/prihlaseni?next=/sluzby" style={{ color: "var(--gold)", fontWeight: 800 }}>Přihlas se</Link> a měj všechno na dosah — nebo si <Link href="/clenstvi" style={{ color: "var(--gold)", fontWeight: 800 }}>pořiď členství</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
