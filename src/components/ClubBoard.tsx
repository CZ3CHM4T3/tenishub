"use client";

// Parent "Můj klub": Aktuality (nástěnka trenéra, čtení) + Kalendář (oboustranný —
// rodič může přidat akci). Data: coach_posts + coach_events (RLS viz supabase/muj-klub.sql).
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Megaphone, CalendarDays, Plus, Trash2 } from "lucide-react";

type Post = { id: string; title: string | null; body: string; created_at: string };
type Ev = { id: string; title: string; starts_at: string; place: string | null; author_name: string | null };

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });
const fmtDT = (iso: string) => new Date(iso).toLocaleString("cs-CZ", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });

export default function ClubBoard({ coachId, authorName }: { coachId: string; authorName: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ open: false, title: "", date: "", time: "", place: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const sb = createClient();
    const [{ data: p }, { data: e }] = await Promise.all([
      sb.from("coach_posts").select("id,title,body,created_at").eq("coach_id", coachId).order("created_at", { ascending: false }).limit(20),
      sb.from("coach_events").select("id,title,starts_at,place,author_name").eq("coach_id", coachId).gte("starts_at", new Date(Date.now() - 864e5).toISOString()).order("starts_at", { ascending: true }).limit(30),
    ]);
    setPosts((p as Post[]) ?? []);
    setEvents((e as Ev[]) ?? []);
    setLoading(false);
  }, [coachId]);
  useEffect(() => { load(); }, [load]);

  const addEvent = async () => {
    if (!form.title.trim() || !form.date) return;
    setBusy(true);
    const sb = createClient();
    const starts = new Date(`${form.date}T${form.time || "17:00"}:00`).toISOString();
    const { error } = await sb.from("coach_events").insert({
      coach_id: coachId, title: form.title.trim(), starts_at: starts, place: form.place.trim() || null, author_name: authorName || "Rodič",
    });
    setBusy(false);
    if (error) { alert("Nepodařilo se přidat: " + error.message + "\n\n(Možná je potřeba spustit supabase/muj-klub.sql.)"); return; }
    setForm({ open: false, title: "", date: "", time: "", place: "" });
    await load();
  };

  const delEvent = async (id: string) => {
    if (!confirm("Smazat tvoji akci?")) return;
    const sb = createClient();
    await sb.from("coach_events").delete().eq("id", id);
    await load();
  };

  return (
    <>
      <div className="acct-card">
        <div className="acct-card-head"><Megaphone size={20} /><h2>Aktuality klubu</h2></div>
        {loading ? <p className="member-note">Načítám…</p> : posts.length === 0 ? (
          <p className="member-note">Zatím žádné novinky od trenéra.</p>
        ) : (
          <div className="cb-posts">
            {posts.map((p) => (
              <div className="cb-post" key={p.id}>
                {p.title && <b>{p.title}</b>}
                <p>{p.body}</p>
                <span className="cb-date">{fmtDate(p.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="acct-card">
        <div className="acct-card-head"><CalendarDays size={20} /><h2>Kalendář klubu</h2>
          <button className="btn btn-out btn-sm" style={{ marginLeft: "auto" }} onClick={() => setForm((f) => ({ ...f, open: !f.open }))}><Plus size={14} /> Přidat akci</button>
        </div>
        <p className="member-note" style={{ marginTop: "-0.3rem" }}>Akce a turnaje. Přidávat může trenér i ty (např. „jedeme na turnaj v sobotu").</p>

        {form.open && (
          <div className="cb-form">
            <div className="acct-grid">
              <div className="fld"><label>Název akce</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Např. Turnaj Dobřichovice" /></div>
              <div className="fld"><label>Místo</label><input value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} placeholder="Kurt / hala / město" /></div>
              <div className="fld"><label>Datum</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="fld"><label>Čas</label><input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
            </div>
            <button className="btn btn-green" disabled={busy || !form.title.trim() || !form.date} onClick={addEvent}>Přidat do kalendáře</button>
          </div>
        )}

        {loading ? <p className="member-note">Načítám…</p> : events.length === 0 ? (
          <p className="member-note">Zatím žádné akce. Přidej první.</p>
        ) : (
          <div className="cb-events">
            {events.map((e) => (
              <div className="cb-event" key={e.id}>
                <div className="cb-ev-when">{fmtDT(e.starts_at)}</div>
                <div className="cb-ev-main"><b>{e.title}</b>{e.place && <span>{e.place}</span>}</div>
                {e.author_name ? <span className="cb-ev-by">{e.author_name}{authorName && e.author_name === authorName ? <button className="cenik-del" onClick={() => delEvent(e.id)} aria-label="Smazat"><Trash2 size={14} /></button> : null}</span> : <span className="cb-ev-by cb-ev-coach">trenér</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
