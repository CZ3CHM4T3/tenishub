"use client";

// Co rodič vidí od svého trenéra: nástěnka (oznámení) + nadcházející akce s přihlášením.
// Zobrazí se jen když je rodič v aktivní komunitě nějakého trenéra (coach_roster).
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Megaphone, CalendarDays, MapPin, Users, Check } from "lucide-react";

type Post = { id: string; title: string | null; body: string; created_at: string };
type Ev = { id: string; title: string; starts_at: string; place: string | null; body: string | null; capacity: number | null; allow_rsvp: boolean };

const fmtP = (iso: string) => new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" });
const fmtD = (iso: string) => new Date(iso).toLocaleString("cs-CZ", { weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });

export function CoachFeed() {
  const supabase = useMemo(() => createClient(), []);
  const [coach, setCoach] = useState<{ id: string; name: string } | null>(null);
  const [me, setMe] = useState<{ id: string; name: string } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [mine, setMine] = useState<Record<string, string>>({}); // event_id -> status
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setReady(true); return; }
    const prof = await supabase.from("profiles").select("full_name,email").eq("id", user.id).maybeSingle();
    setMe({ id: user.id, name: prof.data?.full_name || prof.data?.email || "Rodič" });
    // aktivní trenér rodiče
    const { data: r } = await supabase.from("coach_roster").select("coach_id").eq("member_id", user.id).eq("status", "active").limit(1).maybeSingle();
    const coachId = (r as { coach_id?: string } | null)?.coach_id;
    if (!coachId) { setReady(true); return; }
    const cp = await supabase.from("profiles").select("full_name,email").eq("id", coachId).maybeSingle();
    setCoach({ id: coachId, name: cp.data?.full_name || "Váš trenér" });
    const [{ data: po }, { data: ev }, { data: rs }] = await Promise.all([
      supabase.from("coach_posts").select("id,title,body,created_at").eq("coach_id", coachId).order("created_at", { ascending: false }).limit(8),
      supabase.from("coach_events").select("id,title,starts_at,place,body,capacity,allow_rsvp").eq("coach_id", coachId).gte("starts_at", new Date(Date.now() - 12 * 3600e3).toISOString()).order("starts_at").limit(12),
      supabase.from("event_rsvp").select("event_id,status").eq("member_id", user.id),
    ]);
    setPosts((po as Post[]) ?? []);
    setEvents((ev as Ev[]) ?? []);
    const m: Record<string, string> = {};
    ((rs as { event_id: string; status: string }[]) ?? []).forEach((x) => { m[x.event_id] = x.status; });
    setMine(m);
    setReady(true);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  const rsvp = async (ev: Ev, status: "going" | "out") => {
    if (!me) return;
    setMine((p) => ({ ...p, [ev.id]: status }));
    await supabase.from("event_rsvp").upsert({ event_id: ev.id, member_id: me.id, member_name: me.name, status }, { onConflict: "event_id,member_id" });
    // orientační počítadlo (jen pro moje UI)
    setCounts((c) => ({ ...c, [ev.id]: (c[ev.id] ?? 0) }));
  };

  if (!ready || !coach) return null; // solo rodič bez trenéra nic nevidí

  return (
    <div className="cfeed">
      <div className="cfeed-head"><span className="cfeed-lab">Od trenéra</span><b>{coach.name}</b></div>

      {posts.length > 0 && (
        <div className="cfeed-posts">
          {posts.map((p) => (
            <div className="cfeed-post" key={p.id}>
              <span className="cfeed-ic"><Megaphone size={15} /></span>
              <div><b>{p.title || "Oznámení"}</b><span className="cfeed-date">{fmtP(p.created_at)}</span><p>{p.body}</p></div>
            </div>
          ))}
        </div>
      )}

      {events.length > 0 && (
        <div className="cfeed-events">
          {events.map((e) => {
            const st = mine[e.id];
            return (
              <div className="cfeed-ev" key={e.id}>
                <div className="cfeed-ev-main">
                  <b>{e.title}</b>
                  <span className="cfeed-ev-meta"><CalendarDays size={13} /> {fmtD(e.starts_at)}{e.place && <> · <MapPin size={13} /> {e.place}</>}{e.capacity != null && <> · <Users size={13} /> max {e.capacity}</>}</span>
                  {e.body && <span className="cfeed-ev-body">{e.body}</span>}
                </div>
                {e.allow_rsvp && (
                  <div className="cfeed-rsvp">
                    <button className={`cfeed-btn${st === "going" ? " on" : ""}`} onClick={() => rsvp(e, "going")}>{st === "going" ? <><Check size={14} /> Přihlášeno</> : "Přihlásit dítě"}</button>
                    <button className={`cfeed-btn out${st === "out" ? " on" : ""}`} onClick={() => rsvp(e, "out")}>Nemůžeme</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {posts.length === 0 && events.length === 0 && (
        <p className="member-note">Od trenéra zatím nic nového.</p>
      )}
    </div>
  );
}
