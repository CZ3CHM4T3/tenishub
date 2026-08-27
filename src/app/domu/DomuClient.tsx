"use client";

// Rodičovská landing po loginu: nahoře Profil / Můj klub / Mapa služeb,
// pod tím počasí, dole dlaždice služeb (Moje cesta první). Vše na jedné stránce.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { WeatherWeek } from "@/components/WeatherWeek";
import { UserRound, School, MapPin, Route, Handshake, Trophy, Video, MessagesSquare, HelpCircle, BookOpen, ShoppingBag, Car, CloudSun, ArrowRight, Baby, Dumbbell, HeartPulse, Grip, IdCard, Mail, BadgeCheck, type LucideIcon } from "lucide-react";

// Zkratky na funkce podle zapnutých rolí (Profil → role). Každá role má svůj domov.
const ROLE_HOME: Record<string, { href: string; label: string; Icon: LucideIcon }[]> = {
  rodic: [
    { href: "/deti", label: "Moje děti a klub", Icon: Baby },
    { href: "/moje-cesta", label: "Moje cesta", Icon: Route },
  ],
  sparring: [{ href: "/sparring", label: "Moje sparring karta", Icon: Handshake }],
  trener: [{ href: "/klub", label: "Můj klub (trenér)", Icon: School }],
  vyplet: [{ href: "/ucet?tab=profil", label: "Moje vyplétací karta", Icon: Grip }],
  fyzio: [{ href: "/ucet?tab=profil", label: "Moje fyzio karta", Icon: HeartPulse }],
  fitness: [{ href: "/ucet?tab=profil", label: "Moje fitness karta", Icon: Dumbbell }],
};

// Podnikatelské dlaždice pro experty (trenér/vyplétač/fyzio/fitness).
const PROVIDER_SERVICES = [
  { href: "/ucet?tab=profil", label: "Moje karta", desc: "Profil, ceník a foto — co vidí klienti", Icon: IdCard, hero: true },
  { href: "/zpravy", label: "Zprávy a poptávky", desc: "Klienti, co vás oslovili", Icon: Mail },
  { href: "/ucet?tab=profil", label: "Ověření a Boost", desc: "Odznak důvěry a nefér výhoda", Icon: BadgeCheck },
  { href: "/mapa", label: "Mapa služeb", desc: "Kde vás klienti najdou", Icon: MapPin },
  { href: "/pocasi", label: "Počasí", desc: "Na týden ve vašem okolí", Icon: CloudSun },
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
  const [roles, setRoles] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.replace("/prihlaseni?next=/domu"); return; }
      const { data: p } = await sb.from("profiles").select("full_name,roles,is_coach").eq("id", user.id).maybeSingle();
      setName((p?.full_name || "").split(" ")[0]);
      const arr = (p as { roles?: string[] | null } | null)?.roles;
      let rs = Array.isArray(arr) ? arr : ((p as { is_coach?: boolean } | null)?.is_coach ? ["trener"] : ["rodic"]);
      if (rs.length === 0) rs = ["rodic"];
      setRoles(rs);
      setReady(true);
    })();
  }, [router]);

  const shortcuts = roles.flatMap((r) => ROLE_HOME[r] ?? []);
  const isConsumer = roles.some((r) => ["rodic", "sparring", "hrac"].includes(r));
  const isProvider = roles.some((r) => ["trener", "vyplet", "fyzio", "fitness"].includes(r));
  const middleTile = roles.includes("trener")
    ? { href: "/klub", label: "Můj klub", desc: "Klub, svěřenci, hra", Icon: School, cls: "dh-klub" }
    : isConsumer
      ? { href: "/deti", label: "Můj klub", desc: "Děti, trenér, pokrok", Icon: School, cls: "dh-klub" }
      : { href: "/ucet?tab=profil", label: "Moje karta", desc: "Váš profil pro klienty", Icon: IdCard, cls: "dh-klub" };
  const topTiles = [
    { href: "/ucet?tab=profil", label: "Profil", desc: "Údaje, role, členství", Icon: UserRound, cls: "dh-profil" },
    middleTile,
    { href: "/mapa", label: "Mapa služeb", desc: "Najdi trenéra i kurt", Icon: MapPin, cls: "dh-mapa" },
  ];

  if (!ready) return <div className="acct-loading">Načítám…</div>;

  return (
    <div className="acct-page">
      <SiteHeader />
      <div className="wrap acct-wrap" style={{ maxWidth: 1100 }}>
        <h1 className="acct-h1">{name ? `Ahoj, ${name}!` : "Vítej!"}</h1>
        <p className="member-note" style={{ marginTop: "-0.4rem" }}>Tvůj tenisový klub na jednom místě.</p>

        <div className="dh-top">
          {topTiles.map((t) => (
            <Link href={t.href} key={t.href} className={`dh-tile ${t.cls}`}>
              <span className="dh-ic"><t.Icon size={26} /></span>
              <span className="dh-tx"><b>{t.label}</b><span>{t.desc}</span></span>
              <ArrowRight size={18} className="dh-arr" />
            </Link>
          ))}
        </div>

        {shortcuts.length > 0 && (<>
          <h2 className="dh-h2" style={{ marginTop: "1.4rem" }}>Tvoje role</h2>
          <p className="member-note" style={{ marginTop: "-0.5rem" }}>Podle rolí zapnutých v Profilu. Funkce každé role najdeš na její stránce.</p>
          <div className="dh-roles">
            {shortcuts.map((s) => (
              <Link href={s.href} key={s.label} className="dh-role">
                <span className="dh-role-ic"><s.Icon size={18} /></span>
                <b>{s.label}</b>
                <ArrowRight size={15} className="dh-arr" />
              </Link>
            ))}
          </div>
        </>)}

        <div style={{ margin: "1.2rem 0" }}><WeatherWeek /></div>

        {isProvider && (<>
          <h2 className="dh-h2">Vaše podnikání</h2>
          <div className="dh-grid">
            {PROVIDER_SERVICES.map((s) => (
              <Link href={s.href} key={s.label} className={`dh-svc${s.hero ? " dh-hero" : ""}`}>
                <span className="dh-svc-ic"><s.Icon size={22} /></span>
                <span className="dh-svc-tx"><b>{s.label}</b><span>{s.desc}</span></span>
              </Link>
            ))}
          </div>
          <p className="member-note" style={{ marginTop: ".5rem" }}>Kalendář, online rezervace a objednávky přibývají s <b>PRO</b>.</p>
        </>)}

        {isConsumer && (<>
          <h2 className="dh-h2" style={{ marginTop: isProvider ? "1.6rem" : undefined }}>Služby</h2>
          <div className="dh-grid">
            {SERVICES.map((s) => (
              <Link href={s.href} key={s.href} className={`dh-svc${s.hero ? " dh-hero" : ""}`}>
                <span className="dh-svc-ic"><s.Icon size={22} /></span>
                <span className="dh-svc-tx"><b>{s.label}</b><span>{s.desc}</span></span>
              </Link>
            ))}
          </div>
        </>)}
      </div>
    </div>
  );
}
