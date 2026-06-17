"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";
import { ShieldCheck, Users, BadgeCheck, CalendarCheck, Banknote, MapPin, UserCheck, Flag, Star } from "lucide-react";
import AdminSubjects from "./AdminSubjects";

type Profile = { id: string; full_name: string | null; email: string | null; city: string | null; created_at: string; is_admin: boolean };
type Membership = { id: string; profile_id: string; status: string; started_at: string; expires_at: string; auto_renew: boolean; price_czk: number };
type Booking = { id: string; customer_id: string | null; starts_at: string; price_czk: number | null; status: string; created_at: string };
type NamedRef = { name: string | null } | null;
type Claim = { id: string; status: string; created_at: string; user_id: string; message: string | null; specialists: NamedRef; venues: NamedRef };
type Removal = { id: string; status: string; created_at: string; email: string | null; reason: string | null; specialists: NamedRef; venues: NamedRef };
type Review = { id: string; created_at: string; author_name: string | null; rating: number; body: string | null; r_skill: number | null; r_kids: number | null; r_comm: number | null; r_progress: number | null; r_value: number | null; specialists: NamedRef };

const fmt = (iso: string) => new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });
const fmtT = (iso: string) => new Date(iso).toLocaleString("cs-CZ", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [specCount, setSpecCount] = useState(0);
  const [venueCount, setVenueCount] = useState(0);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [removals, setRemovals] = useState<Removal[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tab, setTab] = useState("prehled");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/prihlaseni"); return; }
    const me = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!me.data?.is_admin) { router.replace("/ucet"); return; }
    const [p, m, b, sc, vc, cl, rm] = await Promise.all([
      supabase.from("profiles").select("id,full_name,email,city,created_at,is_admin").order("created_at", { ascending: false }),
      supabase.from("memberships").select("*").order("created_at", { ascending: false }),
      supabase.from("bookings").select("id,customer_id,starts_at,price_czk,status,created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("specialists").select("*", { count: "exact", head: true }),
      supabase.from("venues").select("*", { count: "exact", head: true }),
      supabase.from("claim_requests").select("id,status,created_at,user_id,message,specialists(name),venues(name)").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("removal_requests").select("id,status,created_at,email,reason,specialists(name),venues(name)").eq("status", "open").order("created_at", { ascending: false }),
    ]);
    const rv = await supabase.from("reviews").select("id,created_at,author_name,rating,body,r_skill,r_kids,r_comm,r_progress,r_value,specialists(name)").eq("status", "pending").order("created_at", { ascending: false });
    setProfiles((p.data as Profile[]) ?? []);
    setMemberships((m.data as Membership[]) ?? []);
    setBookings((b.data as Booking[]) ?? []);
    setSpecCount(sc.count ?? 0);
    setVenueCount(vc.count ?? 0);
    setClaims((cl.data as unknown as Claim[]) ?? []);
    setRemovals((rm.data as unknown as Removal[]) ?? []);
    setReviews((rv.data as unknown as Review[]) ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const activeOf = (pid: string) =>
    memberships.find((m) => m.profile_id === pid && m.status === "active" && new Date(m.expires_at) > new Date()) ?? null;

  const grant = async (pid: string, days: number) => {
    setBusy(pid);
    const supabase = createClient();
    const cur = activeOf(pid);
    if (cur) {
      const exp = new Date(cur.expires_at); exp.setDate(exp.getDate() + days);
      await supabase.from("memberships").update({ expires_at: exp.toISOString() }).eq("id", cur.id);
    } else {
      const exp = new Date(); exp.setDate(exp.getDate() + days);
      await supabase.from("memberships").insert({ profile_id: pid, plan: "hubplus", status: "active", expires_at: exp.toISOString(), auto_renew: true, price_czk: 200 });
    }
    await load(); setBusy(null);
  };

  const stopRenew = async (pid: string) => {
    const cur = activeOf(pid); if (!cur) return;
    setBusy(pid);
    const supabase = createClient();
    await supabase.from("memberships").update({ auto_renew: false }).eq("id", cur.id);
    await load(); setBusy(null);
  };

  const endNow = async (pid: string) => {
    const cur = activeOf(pid); if (!cur) return;
    setBusy(pid);
    const supabase = createClient();
    await supabase.from("memberships").update({ status: "cancelled", auto_renew: false, expires_at: new Date().toISOString() }).eq("id", cur.id);
    await load(); setBusy(null);
  };

  const approveClaim = async (id: string) => {
    setBusy(id);
    const supabase = createClient();
    await supabase.rpc("approve_claim", { claim_id: id });
    await load(); setBusy(null);
  };
  const rejectClaim = async (id: string) => {
    setBusy(id);
    const supabase = createClient();
    await supabase.from("claim_requests").update({ status: "rejected" }).eq("id", id);
    await load(); setBusy(null);
  };
  const resolveRemoval = async (id: string) => {
    setBusy(id);
    const supabase = createClient();
    await supabase.rpc("resolve_removal", { req_id: id });
    await load(); setBusy(null);
  };
  const moderateReview = async (id: string, status: "approved" | "rejected") => {
    setBusy(id);
    const supabase = createClient();
    await supabase.from("reviews").update({ status }).eq("id", id);
    await load(); setBusy(null);
  };
  if (loading) return <div className="acct-loading">Načítám administraci…</div>;

  const TABS: [string, string][] = [
    ["prehled", "Přehled"], ["uzivatele", "Uživatelé"], ["subjekty", "Subjekty"],
    ["recenze", "Recenze"], ["zadosti", "Žádosti"], ["rezervace", "Rezervace"],
  ];

  const activeCount = profiles.filter((p) => activeOf(p.id)).length;
  const paidBookings = bookings.filter((b) => b.status === "paid");
  const revenue = paidBookings.reduce((s, b) => s + (b.price_czk ?? 0), 0);
  const mrr = activeCount * 200;
  const userOf = (id: string | null) => profiles.find((p) => p.id === id);

  return (
    <div className="acct-page">
      <header className="subhdr">
        <div className="wrap">
          <div className="bar">
            <Link href="/" className="brand"><Wordmark /></Link>
            <Link href="/ucet" className="back">← Můj účet</Link>
          </div>
        </div>
      </header>

      <div className="wrap acct-wrap admin-wrap">
        <h1 className="acct-h1"><ShieldCheck size={26} style={{ verticalAlign: "-4px" }} /> Administrace</h1>
        <div className="admin-tabs">
          {TABS.map(([k, l]) => (
            <button key={k} type="button" className={`atab${tab === k ? " on" : ""}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {tab === "prehled" && (
        <div className="admin-stats">
          <div className="astat"><Users size={16} /><b>{profiles.length}</b><span>účtů</span></div>
          <div className="astat"><BadgeCheck size={16} /><b>{activeCount}</b><span>aktivních HUB+</span></div>
          <div className="astat"><Banknote size={16} /><b>{mrr.toLocaleString("cs-CZ")} Kč</b><span>členství / měsíc</span></div>
          <div className="astat"><CalendarCheck size={16} /><b>{bookings.length}</b><span>rezervací</span></div>
          <div className="astat"><Banknote size={16} /><b>{revenue.toLocaleString("cs-CZ")} Kč</b><span>zaplacené rezervace</span></div>
          <div className="astat"><MapPin size={16} /><b>{specCount} / {venueCount}</b><span>specialistů / areálů</span></div>
        </div>

        )}

        {tab === "uzivatele" && (
        <div className="acct-card">
          <div className="acct-card-head"><Users size={20} /><h2>Uživatelé a členství</h2></div>
          <div className="admin-scroll">
            <table className="admin-table">
              <thead>
                <tr><th>Uživatel</th><th>E-mail</th><th>Registrace</th><th>HUB+</th><th>Od</th><th>Do</th><th>Prodloužení</th><th>Akce</th></tr>
              </thead>
              <tbody>
                {profiles.map((p) => {
                  const m = activeOf(p.id);
                  return (
                    <tr key={p.id}>
                      <td><b>{p.full_name || "—"}</b>{p.is_admin && <span className="admin-flag">admin</span>}</td>
                      <td>{p.email || "—"}</td>
                      <td>{fmt(p.created_at)}</td>
                      <td>{m ? <span className="member-badge">AKTIVNÍ</span> : <span className="nomember">—</span>}</td>
                      <td>{m ? fmt(m.started_at) : "—"}</td>
                      <td>{m ? fmt(m.expires_at) : "—"}</td>
                      <td>{m ? (m.auto_renew ? "auto" : "vypnuto") : "—"}</td>
                      <td className="admin-actions">
                        <button onClick={() => grant(p.id, 30)} disabled={busy === p.id}>+30 dní</button>
                        <button onClick={() => grant(p.id, 365)} disabled={busy === p.id}>+rok</button>
                        {m && m.auto_renew && <button onClick={() => stopRenew(p.id)} disabled={busy === p.id}>stop auto</button>}
                        {m && <button className="danger" onClick={() => endNow(p.id)} disabled={busy === p.id}>ukončit</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        )}

        {tab === "zadosti" && (<>
        <div className="acct-card">
          <div className="acct-card-head"><UserCheck size={20} /><h2>Žádosti o převzetí profilu ({claims.length})</h2></div>
          {claims.length === 0 ? (
            <p className="member-note">Žádné čekající žádosti o převzetí.</p>
          ) : (
            <div className="admin-scroll">
              <table className="admin-table">
                <thead><tr><th>Profil</th><th>Žádá uživatel</th><th>Vzkaz</th><th>Datum</th><th>Akce</th></tr></thead>
                <tbody>
                  {claims.map((c) => {
                    const u = userOf(c.user_id);
                    return (
                      <tr key={c.id}>
                        <td><b>{c.specialists?.name || c.venues?.name || "—"}</b></td>
                        <td>{u ? (u.full_name || u.email || "—") : "—"}</td>
                        <td>{c.message || "—"}</td>
                        <td>{fmt(c.created_at)}</td>
                        <td className="admin-actions">
                          <button onClick={() => approveClaim(c.id)} disabled={busy === c.id}>Schválit</button>
                          <button className="danger" onClick={() => rejectClaim(c.id)} disabled={busy === c.id}>Zamítnout</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="member-note" style={{ marginTop: "0.8rem" }}>
            Schválením přiřadíš profil uživateli (může si ho pak sám spravovat) a označíš jako ověřený. Před schválením ověř totožnost (kontakt na uživatele výše).
          </p>
        </div>

        {/* ŽÁDOSTI O ODSTRANĚNÍ (OPT-OUT) */}
        <div className="acct-card">
          <div className="acct-card-head"><Flag size={20} /><h2>Žádosti o odstranění / opt-out ({removals.length})</h2></div>
          {removals.length === 0 ? (
            <p className="member-note">Žádné čekající žádosti o odstranění.</p>
          ) : (
            <div className="admin-scroll">
              <table className="admin-table">
                <thead><tr><th>Profil</th><th>Kontakt</th><th>Důvod</th><th>Datum</th><th>Akce</th></tr></thead>
                <tbody>
                  {removals.map((r) => (
                    <tr key={r.id}>
                      <td><b>{r.specialists?.name || r.venues?.name || "—"}</b></td>
                      <td>{r.email || "—"}</td>
                      <td>{r.reason || "—"}</td>
                      <td>{fmt(r.created_at)}</td>
                      <td className="admin-actions">
                        <button className="danger" onClick={() => resolveRemoval(r.id)} disabled={busy === r.id}>Skrýt profil</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="member-note" style={{ marginTop: "0.8rem" }}>
            „Skrýt profil" profil okamžitě stáhne z webu i mapy. Žádosti vyřizuj co nejdříve (GDPR).
          </p>
        </div>

        </>)}

        {tab === "recenze" && (
        <div className="acct-card">
          <div className="acct-card-head"><Star size={20} /><h2>Recenze ke schválení ({reviews.length})</h2></div>
          {reviews.length === 0 ? (
            <p className="member-note">Žádné čekající recenze.</p>
          ) : (
            <div className="admin-scroll">
              <table className="admin-table">
                <thead><tr><th>Specialista</th><th>Autor</th><th>Hodnocení</th><th>Text</th><th>Akce</th></tr></thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r.id}>
                      <td><b>{r.specialists?.name || "—"}</b></td>
                      <td>{r.author_name || "—"}</td>
                      <td>
                        <span className="member-badge">{r.rating}/5</span>
                        <div style={{ fontSize: "0.74rem", color: "var(--muted)", marginTop: 3 }}>
                          odb {r.r_skill ?? "–"} · děti {r.r_kids ?? "–"} · kom {r.r_comm ?? "–"} · přínos {r.r_progress ?? "–"} · cena {r.r_value ?? "–"}
                        </div>
                      </td>
                      <td style={{ maxWidth: 280 }}>{r.body || "—"}</td>
                      <td className="admin-actions">
                        <button onClick={() => moderateReview(r.id, "approved")} disabled={busy === r.id}>Schválit</button>
                        <button className="danger" onClick={() => moderateReview(r.id, "rejected")} disabled={busy === r.id}>Zamítnout</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="member-note" style={{ marginTop: "0.8rem" }}>
            Recenze schvalujeme my kvůli objektivitě — zveřejní se až po „Schválit".
          </p>
        </div>
        )}

        {tab === "subjekty" && <AdminSubjects />}

        {tab === "rezervace" && (
        <div className="acct-card">
          <div className="acct-card-head"><Banknote size={20} /><h2>Rezervace a platby (posledních {bookings.length})</h2></div>
          {bookings.length === 0 ? (
            <p className="member-note">Zatím žádné rezervace.</p>
          ) : (
            <div className="admin-scroll">
              <table className="admin-table">
                <thead>
                  <tr><th>Vytvořeno</th><th>Termín lekce</th><th>Zákazník</th><th>Cena</th><th>Stav</th></tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const u = userOf(b.customer_id);
                    return (
                      <tr key={b.id}>
                        <td>{fmtT(b.created_at)}</td>
                        <td>{fmtT(b.starts_at)}</td>
                        <td>{u ? (u.full_name || u.email || "—") : "—"}</td>
                        <td><b>{b.price_czk ? `${b.price_czk} Kč` : "—"}</b></td>
                        <td>{b.status === "paid" ? <span className="member-badge">ZAPLACENO</span> : b.status === "cancelled" ? <span className="nomember">zrušeno</span> : "rezervováno"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="member-note" style={{ marginTop: "0.8rem" }}>
            Pozn.: skutečné stržení peněz přijde s napojením GoPay — teď se evidují rezervace a jejich stav.
          </p>
        </div>
        )}
      </div>
    </div>
  );
}
