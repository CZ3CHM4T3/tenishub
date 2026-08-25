"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { BadgeCheck, CalendarCheck, LogOut, UserRound, Store, GraduationCap, Check } from "lucide-react";
import ProviderCard from "./ProviderCard";

const ATABS: { k: string; label: string; Icon: typeof BadgeCheck }[] = [
  { k: "clenstvi", label: "Členství", Icon: BadgeCheck },
  { k: "profil", label: "Profil", Icon: UserRound },
  { k: "karta", label: "Moje karta", Icon: Store },
  { k: "rezervace", label: "Rezervace", Icon: CalendarCheck },
];

// Role = „klobouky". Trenér zdarma (návnada); ostatní role odemyká HUB+.
const ACCOUNT_ROLES: { k: string; label: string; desc: string; free: boolean; soon?: boolean }[] = [
  { k: "trener", label: "Trenér", desc: "Vlastní klub, svěřenci, kalendář, strom dovedností.", free: true },
  { k: "rodic", label: "Rodič", desc: "Moje cesta a nástroje pro dítě.", free: false },
  { k: "sparring", label: "Sparing hráč", desc: "Vlastní karta na zeď, hledání parťáků.", free: false },
  { k: "vyplet", label: "Vyplétač", desc: "Servis raket, objednávky.", free: false, soon: true },
  { k: "fyzio", label: "Fyzioterapeut", desc: "Klienti z tenisu.", free: false, soon: true },
  { k: "fitness", label: "Kondiční trenér", desc: "Kondiční příprava tenistů.", free: false, soon: true },
  { k: "areal", label: "Areál / klub", desc: "Kurty, rezervace, tým trenérů.", free: false, soon: true },
];

type Profile = { id: string; full_name: string | null; email: string | null; role: string | null; city: string | null; phone: string | null; is_admin: boolean; is_coach: boolean };
type Membership = { id: string; plan: string; status: string; started_at: string; expires_at: string; auto_renew: boolean; price_czk: number };
type Booking = { id: string; starts_at: string; price_czk: number | null; status: string };

const fmt = (iso: string) => new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });
const fmtT = (iso: string) => new Date(iso).toLocaleString("cs-CZ", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [name, setName] = useState(""); const [city, setCity] = useState(""); const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [atab, setAtab] = useState("clenstvi");
  const [roles, setRoles] = useState<string[]>([]);
  const [rolesSaved, setRolesSaved] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && ["clenstvi", "profil", "karta", "rezervace"].includes(t)) setAtab(t);
  }, []);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/prihlaseni"); return; }
    const [p, m, b] = await Promise.all([
      supabase.from("profiles").select("id,full_name,email,role,city,phone,is_admin,is_coach").eq("id", user.id).single(),
      supabase.from("memberships").select("*").eq("profile_id", user.id).eq("status", "active")
        .gt("expires_at", new Date().toISOString()).order("expires_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("bookings").select("id,starts_at,price_czk,status").eq("customer_id", user.id)
        .order("starts_at", { ascending: false }).limit(10),
    ]);
    if (p.data) { setProfile(p.data); setName(p.data.full_name ?? ""); setCity(p.data.city ?? ""); setPhone(p.data.phone ?? ""); }
    setMembership((m.data as Membership) ?? null);
    setBookings((b.data as Booking[]) ?? []);
    // role (klobouky) — zvlášť, ať to nespadne, kdyby sloupec ještě nebyl
    const rr = await supabase.from("profiles").select("roles").eq("id", user.id).maybeSingle();
    const arr = (rr.data as { roles?: string[] | null } | null)?.roles;
    setRoles(Array.isArray(arr) ? arr : (p.data?.is_coach ? ["trener"] : []));
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const saveProfile = async () => {
    if (!profile) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ full_name: name, city, phone }).eq("id", profile.id);
    setBusy(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const isMember = !!membership || (profile?.is_admin ?? false);

  const toggleRole = (k: string, free: boolean, soon?: boolean) => {
    if (soon) return;
    if (!free && !isMember) return; // placené role jen s HUB+
    setRoles((r) => r.includes(k) ? r.filter((x) => x !== k) : [...r, k]);
  };

  const saveRoles = async () => {
    if (!profile) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ roles, is_coach: roles.includes("trener") }).eq("id", profile.id);
    if (roles.includes("trener")) { try { await supabase.rpc("become_coach"); } catch { /* */ } }
    await load();
    setBusy(false); setRolesSaved(true); setTimeout(() => setRolesSaved(false), 2000);
  };

  const toggleRenew = async () => {
    if (!membership) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.from("memberships").update({ auto_renew: !membership.auto_renew }).eq("id", membership.id);
    await load(); setBusy(false);
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) return <div className="acct-loading">Načítám účet…</div>;
  if (!profile) return null;

  return (
    <div className="acct-page">
      <SiteHeader />

      <div className="wrap acct-wrap">
        <h1 className="acct-h1">Můj účet</h1>

        {/* ZÁLOŽKOVÉ MENU */}
        <div className="acct-tabs">
          {ATABS.map((t) => (
            <button key={t.k} type="button" className={`acct-tab${atab === t.k ? " on" : ""}`} onClick={() => setAtab(t.k)}>
              <t.Icon size={17} /> {t.label}
            </button>
          ))}
        </div>

        {/* ČLENSTVÍ */}
        {atab === "clenstvi" && (
        <div className={`acct-card member-card${membership || profile.is_admin ? " on" : ""}`}>
          <div className="acct-card-head">
            <BadgeCheck size={20} />
            <h2>HUB+</h2>
            {profile.is_admin ? <span className="member-badge">ADMIN</span> : membership && <span className="member-badge">AKTIVNÍ</span>}
          </div>
          {profile.is_admin ? (
            <p className="member-note">Jako <b>administrátor</b> máš přístup ke všem funkcím webu — členství HUB+ neřešíš.</p>
          ) : membership ? (
            <>
              <div className="member-rows">
                <div className="mrow"><span>Začalo</span><b>{fmt(membership.started_at)}</b></div>
                <div className="mrow"><span>Platí do</span><b>{fmt(membership.expires_at)}</b></div>
                <div className="mrow"><span>Cena</span><b>{membership.price_czk} Kč / měsíc</b></div>
                <div className="mrow"><span>Automatické prodloužení</span><b>{membership.auto_renew ? "zapnuto" : "vypnuto"}</b></div>
              </div>
              <p className="member-note">
                {membership.auto_renew
                  ? <>Členství se {fmt(membership.expires_at)} automaticky prodlouží o měsíc ({membership.price_czk} Kč). Prodlužování můžeš kdykoli vypnout — žádná překvapení.</>
                  : <>Prodlužování je vypnuté. Členství doběhne {fmt(membership.expires_at)} a pak ztratíš přístup k funkcím — tady ho obnovíš.</>}
              </p>
              <button className="btn btn-out" onClick={toggleRenew} disabled={busy}>
                {membership.auto_renew ? "Vypnout automatické prodloužení" : "Zapnout automatické prodloužení"}
              </button>
            </>
          ) : (
            <>
              <p className="member-note">
                <b>Členství HUB+ není aktivní.</b> Bez něj nemáš přístup k funkcím webu (Moje cesta, poradna, sparring, komunita…).
                Členství aktivujeme přes pozvánku; po napojení plateb si ho obnovíš přímo tady.
              </p>
              <Link href="/pristup" className="btn btn-gold">Chci členství</Link>
            </>
          )}
        </div>
        )}

        {/* PROFIL */}
        {atab === "profil" && (<>
        <div className="acct-card">
          <div className="acct-card-head"><UserRound size={20} /><h2>Profil</h2></div>
          <div className="acct-grid">
            <div className="fld"><label>Jméno a příjmení</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="fld"><label>E-mail</label><input value={profile.email ?? ""} disabled /></div>
            <div className="fld"><label>Město</label><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Praha" /></div>
            <div className="fld"><label>Telefon</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+420 …" /></div>
          </div>
          <button className="btn btn-green" onClick={saveProfile} disabled={busy}>{saved ? "✓ Uloženo" : "Uložit změny"}</button>
        </div>

        {/* MOJE ROLE — jeden účet, víc klobouků */}
        <div className="acct-card">
          <div className="acct-card-head"><UserRound size={20} /><h2>Moje role</h2></div>
          <p className="member-note">Jeden účet, klidně víc rolí zároveň. <b>Trenér je zdarma</b>; ostatní role odemyká <b>HUB+</b>. Podle rolí se ti objeví prostory v menu vpravo nahoře.</p>
          {!isMember && <p className="member-note" style={{ color: "var(--gold)" }}>Bez HUB+ si můžeš aktivovat jen trenéra. HUB+ odemkne všechny role.</p>}
          <div className="rolepicker">
            {ACCOUNT_ROLES.map((r) => {
              const on = roles.includes(r.k);
              const locked = !r.free && !isMember;
              const disabled = r.soon || locked;
              return (
                <button key={r.k} type="button" className={`rolepick-row${on ? " on" : ""}${disabled ? " dis" : ""}`} onClick={() => toggleRole(r.k, r.free, r.soon)}>
                  <span className="rp-check">{on ? <Check size={15} /> : null}</span>
                  <span className="rp-txt"><b>{r.label}{r.free && <span className="rp-free">zdarma</span>}{!r.free && !r.soon && <span className="rp-hub">HUB+</span>}{r.soon && <span className="rp-soon">brzy</span>}</b><span>{r.desc}</span></span>
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", marginTop: ".9rem" }}>
            <button className="btn btn-green" onClick={saveRoles} disabled={busy}>{rolesSaved ? "✓ Uloženo" : "Uložit role"}</button>
            {roles.includes("trener") && <Link href="/klub" className="btn btn-out"><GraduationCap size={16} /> Trenérské rozhraní</Link>}
          </div>
        </div>

        <button className="btn btn-out acct-logout" onClick={logout}><LogOut size={16} /> Odhlásit se</button>
        </>)}

        {/* MOJE KARTA (samospráva trenér/areál) */}
        {atab === "karta" && (
          <ProviderCard userId={profile.id} fullName={name} isMember={!!membership || profile.is_admin} />
        )}

        {/* REZERVACE */}
        {atab === "rezervace" && (
        <div className="acct-card">
          <div className="acct-card-head"><CalendarCheck size={20} /><h2>Moje rezervace</h2></div>
          {bookings.length === 0 ? (
            <p className="member-note">Zatím žádné rezervace. <Link href="/mapa" style={{ color: "var(--gold)", fontWeight: 700 }}>Najdi si trenéra →</Link></p>
          ) : (
            <div className="member-rows">
              {bookings.map((b) => (
                <div className="mrow" key={b.id}>
                  <span>{fmtT(b.starts_at)}</span>
                  <b>{b.price_czk ? `${b.price_czk} Kč` : "—"} · {b.status === "paid" ? "zaplaceno" : b.status === "cancelled" ? "zrušeno" : "rezervováno"}</b>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
