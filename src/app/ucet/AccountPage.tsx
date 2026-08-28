"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { BadgeCheck, CalendarCheck, LogOut, UserRound, GraduationCap, Check, ImagePlus } from "lucide-react";
import ProviderCard from "./ProviderCard";
import Kalendar from "./Kalendar";
import { BuyMembership } from "@/components/BuyMembership";
import { WeatherWeek } from "@/components/WeatherWeek";
import { getViewAs, type ViewAs } from "@/lib/viewAs";

const ATABS: { k: string; label: string; Icon: typeof BadgeCheck }[] = [
  { k: "clenstvi", label: "Členství", Icon: BadgeCheck },
  { k: "profil", label: "Profil", Icon: UserRound },
  { k: "rezervace", label: "Kalendář", Icon: CalendarCheck },
];

// Role = „klobouky". Trenér zdarma (návnada); spotřebitel = HUB+, poskytovatel = Trenér+/Expert+.
const ACCOUNT_ROLES: { k: string; label: string; desc: string; free: boolean; badge?: string; cls?: string; soon?: boolean }[] = [
  { k: "trener", label: "Trenér", desc: "Profil zdarma (pin, svěřenci, zvací odkaz). Rezervace, kalendář a ověření s Trenér+.", free: true, badge: "zdarma", cls: "rp-free" },
  { k: "rodic", label: "Rodič", desc: "Moje cesta a nástroje pro dítě.", free: false, badge: "HUB+", cls: "rp-hub" },
  { k: "hrac", label: "Hráč", desc: "Rezervace kurtů, statistiky zápasů — a sparring: najdi si parťáka.", free: false, badge: "HUB+", cls: "rp-hub" },
  { k: "vyplet", label: "Vyplétač", desc: "Neověřený profil zdarma (pin + web). Objednávky a ověření s Expert+.", free: true, badge: "Expert+", cls: "rp-exp" },
  { k: "fyzio", label: "Fyzioterapeut", desc: "Klienti z tenisu.", free: false, soon: true },
  { k: "fitness", label: "Fitness trenér", desc: "Kondiční příprava tenistů.", free: false, soon: true },
  { k: "areal", label: "Areál / klub", desc: "Kurty, rezervace, tým trenérů.", free: false, soon: true },
];

type Profile = { id: string; full_name: string | null; email: string | null; role: string | null; city: string | null; phone: string | null; photo_url: string | null; is_admin: boolean; is_coach: boolean };
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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [atab, setAtab] = useState("clenstvi");
  const [roles, setRoles] = useState<string[]>([]);
  const [rolesSaved, setRolesSaved] = useState(false);
  const [view, setView] = useState<ViewAs>("admin"); // admin náhled perspektivy (identický s rolí)

  useEffect(() => { setView(getViewAs()); }, []);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "karta") setAtab("profil"); // karta se sloučila do profilu
    else if (t && ["clenstvi", "profil", "rezervace"].includes(t)) setAtab(t);
  }, []);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/prihlaseni"); return; }
    const [p, m, b] = await Promise.all([
      supabase.from("profiles").select("id,full_name,email,role,city,phone,photo_url,is_admin,is_coach").eq("id", user.id).single(),
      supabase.from("memberships").select("*").eq("profile_id", user.id).eq("status", "active")
        .gt("expires_at", new Date().toISOString()).order("expires_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("bookings").select("id,starts_at,price_czk,status").eq("customer_id", user.id)
        .order("starts_at", { ascending: false }).limit(10),
    ]);
    if (p.data) { setProfile(p.data); setName(p.data.full_name ?? ""); setCity(p.data.city ?? ""); setPhone(p.data.phone ?? ""); setPhotoUrl(p.data.photo_url ?? null); }
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
    await supabase.from("profiles").update({ full_name: name, city, phone, photo_url: photoUrl }).eq("id", profile.id);
    // sdílená identita → propíše se do veřejných karet (jméno/město/telefon/e-mail/foto se nevyplňují dvakrát)
    await supabase.from("specialists").update({ name, city, phone, email: profile.email, photo_url: photoUrl }).eq("owner_id", profile.id);
    setBusy(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const uploadAvatar = async (file: File) => {
    if (!profile) return;
    setBusy(true);
    const supabase = createClient();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
    const up = await supabase.storage.from("photos").upload(path, file, { upsert: true });
    if (up.error) { setBusy(false); return; }
    const url = supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
    setPhotoUrl(url);
    await supabase.from("profiles").update({ photo_url: url }).eq("id", profile.id);
    await supabase.from("specialists").update({ photo_url: url }).eq("owner_id", profile.id);
    setBusy(false);
  };

  // NÁHLED = 1:1. Když admin kouká očima role, počítáme role/členství podle role, ne podle admina.
  const realAdmin = profile?.is_admin ?? false;
  const previewing = realAdmin && view !== "admin";
  const editable = !previewing; // v náhledu se needituje (needitujeme admin data)
  // Poskytovatel = má veřejnou kartu (trenér/vyplétač/…); rodič a hráč jsou spotřebitelé.
  const PROVIDER_ROLES = ["trener", "vyplet", "fyzio", "fitness", "areal"];
  const effRoles = previewing ? (view === "navstevnik" ? [] : [view]) : roles;
  const isProvider = effRoles.some((r) => PROVIDER_ROLES.includes(r));
  const isMember = previewing ? view !== "navstevnik" : (!!membership || realAdmin);
  // Placený poskytovatel (Expert+/Trenér+) = plná karta (bio, ceník, foto, dostupnost). Zatím jen admin mimo náhled;
  // po napojení plateb = reálné členství. Free poskytovatel má jen pin + jméno + web.
  const canPro = realAdmin && !previewing;

  const toggleRole = (k: string, free: boolean, soon?: boolean) => {
    if (soon || previewing) return; // „brzy" role zatím nejdou zapnout; v náhledu se needituje
    if (!free && !isMember) return; // placené role vyžadují členství (rodič/hráč = HUB+, obory = Expert+)
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

  const rolePickerUI = (
    <>
      {editable && <p className="member-note">Poskytovatelé (trenér, vyplétač) si <b>zdarma</b> udělají neověřený profil — pin na mapě + jméno a web. <b>Rodič a hráč</b> jsou v HUB+. Ověření a plné funkce (bio, ceník, rezervace…) = členství.</p>}
      <div className="rolepicker">
        {ACCOUNT_ROLES.map((r) => {
          const on = effRoles.includes(r.k);
          const locked = !r.free && !isMember;
          const disabled = r.soon || locked || !editable;
          return (
            <button key={r.k} type="button" className={`rolepick-row${on ? " on" : ""}${disabled ? " dis" : ""}`} onClick={() => toggleRole(r.k, r.free, r.soon)}>
              <span className="rp-check">{on ? <Check size={15} /> : null}</span>
              <span className="rp-txt"><b>{r.label}{r.soon && <span className="rp-soon">brzy</span>}</b><span>{r.desc}</span></span>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", marginTop: ".9rem" }}>
        {editable && <button className="btn btn-green" onClick={saveRoles} disabled={busy}>{rolesSaved ? "✓ Uloženo" : "Uložit role"}</button>}
        {effRoles.includes("trener") && <Link href="/klub" className="btn btn-out"><GraduationCap size={16} /> Trenérské rozhraní</Link>}
      </div>
    </>
  );

  if (loading) return <div className="acct-loading">Načítám účet…</div>;
  if (!profile) return null;

  return (
    <div className="acct-page">
      <SiteHeader />

      <div className="wrap acct-wrap">
        <h1 className="acct-h1">Profil</h1>

        {/* POČASÍ — hned po přihlášení, podle města z profilu */}
        <div style={{ marginBottom: "1.1rem" }}><WeatherWeek /></div>

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
        <div className={`acct-card member-card${isMember ? " on" : ""}`}>
          <div className="acct-card-head">
            <BadgeCheck size={20} />
            <h2>HUB+</h2>
            {realAdmin && !previewing ? <span className="member-badge">ADMIN</span> : isMember ? <span className="member-badge">AKTIVNÍ</span> : null}
          </div>
          {realAdmin && !previewing ? (
            <p className="member-note">Jako <b>administrátor</b> máš přístup ke všem funkcím webu — členství HUB+ neřešíš.</p>
          ) : membership ? (
            <>
              <div className="member-rows">
                <div className="mrow"><span>Začalo</span><b>{fmt(membership.started_at)}</b></div>
                <div className="mrow"><span>Platí do</span><b>{fmt(membership.expires_at)} · zbývá {Math.max(0, Math.ceil((new Date(membership.expires_at).getTime() - Date.now()) / 86400000))} dní</b></div>
                <div className="mrow"><span>Cena</span><b>{membership.price_czk} Kč / měsíc</b></div>
                <div className="mrow"><span>Automatické prodloužení</span><b>{membership.auto_renew ? "zapnuto" : "vypnuto"}</b></div>
              </div>
              {(() => {
                const perMonth = 199 - membership.price_czk;
                if (perMonth <= 0) return null;
                const months = Math.max(1, Math.floor((Date.now() - new Date(membership.started_at).getTime()) / (1000 * 60 * 60 * 24 * 30)) + 1);
                return (
                  <div className="savings-card">
                    <div className="savings-big">{(months * perMonth).toLocaleString("cs-CZ")} Kč</div>
                    <div className="savings-txt">už jsi ušetřil jako <b>zakládající člen</b> (99 místo 199 Kč / měsíc). A drží ti to napořád — {perMonth} Kč každý další měsíc.</div>
                  </div>
                );
              })()}
              <p className="member-note">
                {membership.auto_renew
                  ? <>Členství se {fmt(membership.expires_at)} automaticky prodlouží o měsíc ({membership.price_czk} Kč). Prodlužování můžeš kdykoli vypnout — žádná překvapení.</>
                  : <>Prodlužování je vypnuté. Členství doběhne {fmt(membership.expires_at)} a pak ztratíš přístup k funkcím — tady ho obnovíš.</>}
              </p>
              <button className="btn btn-out" onClick={toggleRenew} disabled={busy}>
                {membership.auto_renew ? "Vypnout automatické prodloužení" : "Zapnout automatické prodloužení"}
              </button>
            </>
          ) : isMember ? (
            <p className="member-note"><b>Členství HUB+ je aktivní.</b> Máš přístup ke všem funkcím webu — Moje cesta, poradna, sparring, komunita a nástroje.{previewing ? " (náhled role)" : ""}</p>
          ) : (
            <>
              <p className="member-note">
                <b>Členství HUB+ není aktivní.</b> Bez něj nemáš přístup k funkcím webu (Moje cesta, poradna, sparring, komunita…).
                Zaplať kartou a odemkne se ti hned — týden zdarma, kdykoli zrušíš.
              </p>
              <BuyMembership plan="hub_plus" />
            </>
          )}
        </div>
        )}

        {/* PROFIL */}
        {atab === "profil" && (<>
        <div className="acct-card">
          <div className="acct-card-head"><UserRound size={20} /><h2>Osobní údaje</h2></div>
          <p className="member-note">Vyplň jednou — použije se v celém účtu{isProvider ? " i na tvé veřejné kartě" : ""}. <b>Město</b> určuje počasí i turnaje ve tvém okolí.</p>
          <div className="card-photo">
            <div className="card-photo-prev" style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : undefined}>
              {!photoUrl && (isProvider ? <ImagePlus size={26} /> : <UserRound size={32} />)}
            </div>
            <div>
              <button className="btn btn-out" disabled={busy} onClick={() => fileRef.current?.click()}><ImagePlus size={15} /> {photoUrl ? "Změnit fotku" : "Nahrát fotku"}</button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
              <p className="hint">{isProvider ? "Tvoje profilová fotka — uvidí ji hráči na kartě." : "Tvoje profilová fotka (nepovinné)."}</p>
            </div>
          </div>
          <div className="acct-grid">
            <div className="fld"><label>Jméno a příjmení</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="fld"><label>E-mail</label><input value={profile.email ?? ""} disabled /></div>
            <div className="fld"><label>Město</label><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Praha" /></div>
            <div className="fld"><label>Telefon</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+420 …" /></div>
          </div>
          <button className="btn btn-green" onClick={saveProfile} disabled={busy}>{saved ? "✓ Uloženo" : "Uložit změny"}</button>
        </div>

        {/* ROLE — čím tu jsi. Zaškrtnutím poskytovatelské role se níž objeví veřejná karta k doplnění. */}
        <div className="acct-card">
          <div className="acct-card-head"><UserRound size={20} /><h2>Role</h2></div>
          <p className="member-note">Zaškrtni, čím tu jsi — tím se ti zpřístupní odpovídající prostory v menu a doplníš si profil. Jeden účet, klidně víc rolí. <b>Trenér je zdarma</b>; ostatní role odemyká členství.</p>
          {rolePickerUI}
        </div>

        {/* VEŘEJNÁ KARTA — část profilu poskytovatele; víc rolí = záložky uvnitř karty */}
        {isProvider && <ProviderCard userId={profile.id} identity={{ fullName: name, city, phone, email: profile.email, photoUrl }} roles={effRoles} canPro={canPro} />}

        <button className="btn btn-out acct-logout" onClick={logout}><LogOut size={16} /> Odhlásit se</button>
        </>)}

        {/* KALENDÁŘ (rezervace + vlastní barevné akce) */}
        {atab === "rezervace" && <Kalendar userId={profile.id} />}
      </div>
    </div>
  );
}
