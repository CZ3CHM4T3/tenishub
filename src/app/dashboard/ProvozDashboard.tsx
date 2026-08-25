"use client";

// Provozní dashboard pro subjekt (areál / trenér). ZATÍM JEN PRO ADMINA (Jan).
// Náhled kompletního nástroje, který později nabídneme subjektům za malý poplatek.
// Data se čtou klientsky (server-side fetch na Supabase v tomto prostředí selhává).
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { LayoutDashboard, CalendarDays, Users, Banknote, Building2, User, Clock, Lock } from "lucide-react";

type Subject = { type: "venue" | "specialist"; id: string; name: string; city: string | null };
type Court = { id: string; name: string; indoor: boolean };
type Booking = { id: string; specialist_id: string | null; court_id: string | null; customer_id: string | null; starts_at: string; price_czk: number | null; status: string };

const HOURS = Array.from({ length: 14 }, (_, i) => 8 + i); // 8:00–21:00
const sameDay = (iso: string, d: Date) => { const x = new Date(iso); return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth() && x.getDate() === d.getDate(); };
const fmtT = (iso: string) => new Date(iso).toLocaleString("cs-CZ", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });

export default function ProvozDashboard() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sel, setSel] = useState<Subject | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [subLoading, setSubLoading] = useState(false);

  // admin gate + načtení subjektů
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/prihlaseni?next=/dashboard"); return; }
      const me = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
      if (!me.data?.is_admin) { router.replace("/ucet"); return; }
      setAllowed(true);
      const [v, s] = await Promise.all([
        supabase.from("venues").select("id,name,city").order("name"),
        supabase.from("specialists").select("id,name,city").is("venue_id", null).order("name"),
      ]);
      const subs: Subject[] = [
        ...((v.data as { id: string; name: string; city: string | null }[]) ?? []).map((x) => ({ type: "venue" as const, id: x.id, name: x.name, city: x.city })),
        ...((s.data as { id: string; name: string; city: string | null }[]) ?? []).map((x) => ({ type: "specialist" as const, id: x.id, name: x.name, city: x.city })),
      ];
      setSubjects(subs);
      setSel(subs[0] ?? null);
      setLoading(false);
    })();
  }, [supabase, router]);

  // načtení dat pro vybraný subjekt
  const loadSubject = useCallback(async (s: Subject) => {
    setSubLoading(true);
    let bk: Booking[] = [];
    let crt: Court[] = [];
    if (s.type === "venue") {
      const c = await supabase.from("courts").select("id,name,indoor").eq("venue_id", s.id).order("name");
      crt = (c.data as Court[]) ?? [];
      const ids = crt.map((x) => x.id);
      if (ids.length) {
        const b = await supabase.from("bookings").select("id,specialist_id,court_id,customer_id,starts_at,price_czk,status").in("court_id", ids).order("starts_at");
        bk = (b.data as Booking[]) ?? [];
      }
    } else {
      const b = await supabase.from("bookings").select("id,specialist_id,court_id,customer_id,starts_at,price_czk,status").eq("specialist_id", s.id).order("starts_at");
      bk = (b.data as Booking[]) ?? [];
    }
    // jména zákazníků (admin má právo číst profily)
    const custIds = [...new Set(bk.map((x) => x.customer_id).filter(Boolean) as string[])];
    const nm: Record<string, string> = {};
    if (custIds.length) {
      const p = await supabase.from("profiles").select("id,full_name,email").in("id", custIds);
      for (const row of (p.data as { id: string; full_name: string | null; email: string | null }[]) ?? []) nm[row.id] = row.full_name || row.email || "Zákazník";
    }
    setCourts(crt); setBookings(bk); setNames(nm); setSubLoading(false);
  }, [supabase]);

  useEffect(() => { if (sel) loadSubject(sel); }, [sel, loadSubject]);

  if (loading) return <div className="acct-loading">Načítám dashboard…</div>;
  if (!allowed) return null;

  const now = new Date();
  const active = bookings.filter((b) => b.status !== "cancelled");
  const todayCount = active.filter((b) => sameDay(b.starts_at, now)).length;
  const weekAhead = new Date(now.getTime() + 7 * 864e5);
  const weekCount = active.filter((b) => { const d = new Date(b.starts_at); return d >= now && d <= weekAhead; }).length;
  const revenue = bookings.filter((b) => b.status === "paid").reduce((s, b) => s + (b.price_czk ?? 0), 0);
  const clients = new Set(active.map((b) => b.customer_id).filter(Boolean)).size;
  const upcoming = active.filter((b) => new Date(b.starts_at) >= now).slice(0, 20);

  // mřížka kurtů pro dnešek
  const cellBooking = (courtId: string, hour: number) =>
    active.find((b) => b.court_id === courtId && sameDay(b.starts_at, now) && new Date(b.starts_at).getHours() === hour);

  return (
    <div className="acct-page">
      <SiteHeader />

      <div className="wrap acct-wrap">
        <div className="demo-banner">👁️ Ukázka (demo) — čísla jsou ilustrativní, ne reálná data. Slouží jen jako náhled, jak bude dashboard vypadat.</div>
        <div className="dash-head">
          <div>
            <h1 className="acct-h1"><LayoutDashboard size={26} style={{ verticalAlign: "-4px" }} /> Provozní dashboard</h1>
            <p className="member-note" style={{ margin: 0 }}><Lock size={13} style={{ verticalAlign: "-2px" }} /> Interní náhled — vidíš jen ty (admin). Nástroj, který nabídneme subjektům.</p>
          </div>
          <label className="dash-picker">
            <span>Subjekt</span>
            <select value={sel ? `${sel.type}:${sel.id}` : ""} onChange={(e) => { const [t, id] = e.target.value.split(":"); setSel(subjects.find((s) => s.type === t && s.id === id) ?? null); }}>
              <optgroup label="Areály / kluby">
                {subjects.filter((s) => s.type === "venue").map((s) => <option key={s.id} value={`venue:${s.id}`}>{s.name}{s.city ? ` · ${s.city}` : ""}</option>)}
              </optgroup>
              <optgroup label="Trenéři (samostatní)">
                {subjects.filter((s) => s.type === "specialist").map((s) => <option key={s.id} value={`specialist:${s.id}`}>{s.name}{s.city ? ` · ${s.city}` : ""}</option>)}
              </optgroup>
            </select>
          </label>
        </div>

        {!sel ? <p className="member-note">Žádné subjekty v databázi — spusť velký SQL pro naplnění daty.</p> : (<>
          <div className="dash-sub">
            {sel.type === "venue" ? <Building2 size={16} /> : <User size={16} />}
            <b>{sel.name}</b>{sel.city ? <span>· {sel.city}</span> : null}
            <span className="dash-tag">{sel.type === "venue" ? "Areál" : "Trenér"}</span>
          </div>

          <div className="dash-stats">
            <div className="dstat"><CalendarDays size={16} /><b>{todayCount}</b><span>rezervací dnes</span></div>
            <div className="dstat"><Clock size={16} /><b>{weekCount}</b><span>příštích 7 dní</span></div>
            <div className="dstat"><Users size={16} /><b>{clients}</b><span>zákazníků</span></div>
            <div className="dstat"><Banknote size={16} /><b>{revenue.toLocaleString("cs-CZ")} Kč</b><span>zaplaceno</span></div>
          </div>

          {subLoading ? <p className="member-note">Načítám subjekt…</p> : (<>
            {sel.type === "venue" && (
              <div className="acct-card">
                <div className="acct-card-head"><CalendarDays size={20} /><h2>Obsazenost kurtů — dnes</h2></div>
                {courts.length === 0 ? <p className="member-note">Tento areál nemá v databázi zadané kurty.</p> : (
                  <div className="gridscroll">
                    <div className="court-grid">
                      <div className="grow ghead"><div className="gc" />{HOURS.map((h) => <div className="gc" key={h}>{h}:00</div>)}</div>
                      {courts.map((c) => (
                        <div className="grow" key={c.id}>
                          <div className="court">{c.name}{c.indoor ? " · krytý" : ""}</div>
                          {HOURS.map((h) => { const b = cellBooking(c.id, h); return (
                            <div className={`cell ${b ? "book" : "free"}`} key={h} title={b ? fmtT(b.starts_at) : "volno"}>{b ? "•" : "volno"}</div>
                          ); })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="note">Zatím čtení reálného stavu. Klik-rezervace + platba přijde s napojením GoPay.</div>
              </div>
            )}

            <div className="acct-card">
              <div className="acct-card-head"><Clock size={20} /><h2>Nadcházející rezervace ({upcoming.length})</h2></div>
              {upcoming.length === 0 ? <p className="member-note">Zatím žádné nadcházející rezervace.</p> : (
                <div className="admin-scroll">
                  <table className="admin-table">
                    <thead><tr><th>Termín</th><th>Zákazník</th>{sel.type === "venue" && <th>Kurt</th>}<th>Cena</th><th>Stav</th></tr></thead>
                    <tbody>
                      {upcoming.map((b) => (
                        <tr key={b.id}>
                          <td>{fmtT(b.starts_at)}</td>
                          <td>{b.customer_id ? (names[b.customer_id] ?? "Zákazník") : "—"}</td>
                          {sel.type === "venue" && <td>{courts.find((c) => c.id === b.court_id)?.name ?? "—"}</td>}
                          <td><b>{b.price_czk ? `${b.price_czk} Kč` : "—"}</b></td>
                          <td>{b.status === "paid" ? <span className="member-badge">ZAPLACENO</span> : b.status === "cancelled" ? <span className="nomember">zrušeno</span> : "rezervováno"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>)}
        </>)}
      </div>
    </div>
  );
}
