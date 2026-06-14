"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";
import { BadgeCheck, CalendarCheck, LogOut, ShieldCheck, UserRound } from "lucide-react";
import ProviderCard from "./ProviderCard";

type Profile = { id: string; full_name: string | null; email: string | null; role: string | null; city: string | null; phone: string | null; is_admin: boolean };
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

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/prihlaseni"); return; }
    const [p, m, b] = await Promise.all([
      supabase.from("profiles").select("id,full_name,email,role,city,phone,is_admin").eq("id", user.id).single(),
      supabase.from("memberships").select("*").eq("profile_id", user.id).eq("status", "active")
        .gt("expires_at", new Date().toISOString()).order("expires_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("bookings").select("id,starts_at,price_czk,status").eq("customer_id", user.id)
        .order("starts_at", { ascending: false }).limit(10),
    ]);
    if (p.data) { setProfile(p.data); setName(p.data.full_name ?? ""); setCity(p.data.city ?? ""); setPhone(p.data.phone ?? ""); }
    setMembership((m.data as Membership) ?? null);
    setBookings((b.data as Booking[]) ?? []);
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

  const activate = async () => {
    if (!profile) return;
    setBusy(true);
    const supabase = createClient();
    const expires = new Date(); expires.setDate(expires.getDate() + 30);
    await supabase.from("memberships").insert({
      profile_id: profile.id, plan: "hubplus", status: "active",
      expires_at: expires.toISOString(), auto_renew: true, price_czk: 200,
    });
    await load(); setBusy(false);
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
      <header className="subhdr">
        <div className="wrap">
          <div className="bar">
            <Link href="/" className="brand"><Wordmark /></Link>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {profile.is_admin && <Link href="/admin" className="back"><ShieldCheck size={15} style={{ verticalAlign: "-2px" }} /> Admin</Link>}
              <Link href="/" className="back">← Zpět na web</Link>
            </div>
          </div>
        </div>
      </header>

      <div className="wrap acct-wrap">
        <h1 className="acct-h1">Můj účet</h1>

        {/* ČLENSTVÍ */}
        <div className={`acct-card member-card${membership ? " on" : ""}`}>
          <div className="acct-card-head">
            <BadgeCheck size={20} />
            <h2>Členství HUB+</h2>
            {membership && <span className="member-badge">AKTIVNÍ</span>}
          </div>
          {membership ? (
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
                  : <>Prodlužování je vypnuté. Členství doběhne {fmt(membership.expires_at)} a pak nic neplatíš.</>}
              </p>
              <button className="btn btn-out" onClick={toggleRenew} disabled={busy}>
                {membership.auto_renew ? "Vypnout automatické prodloužení" : "Zapnout automatické prodloužení"}
              </button>
            </>
          ) : (
            <>
              <p className="member-note">
                Zatím nemáš členství. <b>HUB+</b> odemkne rezervace, zprávy a všechny členské funkce za <b>200 Kč / měsíc</b>.
                Začalo a konec uvidíš vždy tady, prodloužení jde kdykoli vypnout.
              </p>
              <button className="btn btn-gold" onClick={activate} disabled={busy}>
                Aktivovat HUB+ (zkušebních 30 dní zdarma)
              </button>
            </>
          )}
        </div>

        {/* PROFIL */}
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

        {/* MOJE KARTA (samospráva trenér/areál) */}
        <ProviderCard userId={profile.id} fullName={name} />

        {/* REZERVACE */}
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

        <button className="btn btn-out acct-logout" onClick={logout}><LogOut size={16} /> Odhlásit se</button>
      </div>
    </div>
  );
}
