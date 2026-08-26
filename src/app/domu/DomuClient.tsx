"use client";

// Rodičovská landing po loginu: nahoře Profil / Můj klub / Mapa služeb,
// pod tím počasí, dole dlaždice služeb (Moje cesta první). Vše na jedné stránce.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { WeatherWeek } from "@/components/WeatherWeek";
import { UserRound, School, MapPin, Route, Handshake, Trophy, Video, MessagesSquare, HelpCircle, BookOpen, ShoppingBag, Car, CloudSun, ArrowRight } from "lucide-react";

const TOP = [
  { href: "/ucet?tab=profil", label: "Profil", desc: "Údaje, role, členství", Icon: UserRound, cls: "dh-profil" },
  { href: "/deti", label: "Můj klub", desc: "Děti, trenér, pokrok", Icon: School, cls: "dh-klub" },
  { href: "/mapa", label: "Mapa služeb", desc: "Najdi trenéra i kurt", Icon: MapPin, cls: "dh-mapa" },
];

const SERVICES = [
  { href: "/moje-cesta", label: "Moje cesta", desc: "Celá cesta dítěte na jednom místě", Icon: Route, hero: true },
  { href: "/sparring", label: "Sparring", desc: "Najdi parťáka na úroveň", Icon: Handshake },
  { href: "/turnaje", label: "Turnaje", desc: "Kalendář turnajů", Icon: Trophy },
  { href: "/videorozbor", label: "Videorozbor", desc: "Rozbor hry od experta", Icon: Video },
  { href: "/forum", label: "Fórum rodičů", desc: "Komunita, co je o krok dál", Icon: MessagesSquare },
  { href: "/poradna", label: "Poradna", desc: "Zeptej se odborníka", Icon: HelpCircle },
  { href: "/clanky", label: "Knihovna", desc: "Články a návody", Icon: BookOpen },
  { href: "/bazar", label: "Bazar", desc: "Vybavení z druhé ruky", Icon: ShoppingBag },
  { href: "/spolujizda", label: "Spolujízda", desc: "Sdílená doprava na akce", Icon: Car },
  { href: "/pocasi", label: "Počasí", desc: "Na týden ve tvém okolí", Icon: CloudSun },
];

export default function DomuClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.replace("/prihlaseni?next=/domu"); return; }
      const { data: p } = await sb.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      setName((p?.full_name || "").split(" ")[0]);
      setReady(true);
    })();
  }, [router]);

  if (!ready) return <div className="acct-loading">Načítám…</div>;

  return (
    <div className="acct-page">
      <SiteHeader />
      <div className="wrap acct-wrap" style={{ maxWidth: 1100 }}>
        <h1 className="acct-h1">{name ? `Ahoj, ${name}!` : "Vítej!"}</h1>
        <p className="member-note" style={{ marginTop: "-0.4rem" }}>Tvůj tenisový klub na jednom místě.</p>

        <div className="dh-top">
          {TOP.map((t) => (
            <Link href={t.href} key={t.href} className={`dh-tile ${t.cls}`}>
              <span className="dh-ic"><t.Icon size={26} /></span>
              <span className="dh-tx"><b>{t.label}</b><span>{t.desc}</span></span>
              <ArrowRight size={18} className="dh-arr" />
            </Link>
          ))}
        </div>

        <div style={{ margin: "1.2rem 0" }}><WeatherWeek /></div>

        <h2 className="dh-h2">Služby</h2>
        <div className="dh-grid">
          {SERVICES.map((s) => (
            <Link href={s.href} key={s.href} className={`dh-svc${s.hero ? " dh-hero" : ""}`}>
              <span className="dh-svc-ic"><s.Icon size={22} /></span>
              <span className="dh-svc-tx"><b>{s.label}</b><span>{s.desc}</span></span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
