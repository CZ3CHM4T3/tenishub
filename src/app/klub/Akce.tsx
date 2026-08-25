"use client";

// Akce trenéra (kalendář) s přihlašováním. Trenér vytvoří akci s kapacitou,
// rodiče se přihlásí a trenér vidí, kdo přijde a kolik je volných míst.
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CalendarDays, Plus, MapPin, Users, Trash2, X, Folder } from "lucide-react";

type Ev = { id: string; title: string; starts_at: string; place: string | null; body: string | null; capacity: number | null; allow_rsvp: boolean; group_id: string | null };
type Rsvp = { event_id: string; member_name: string | null; status: string };
type Group = { id: string; name: string };

const fmtD = (iso: string) => new Date(iso).toLocaleString("cs-CZ", { weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });

export function Akce({ coachId }: { coachId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<Ev[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", starts_at: "", place: "", capacity: "", body: "", group_id: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [{ data }, { data: g }] = await Promise.all([
      supabase.from("coach_events").select("id,title,starts_at,place,body,capacity,allow_rsvp,group_id").eq("coach_id", coachId).order("starts_at", { ascending: true }),
      supabase.from("coach_groups").select("id,name").eq("coach_id", coachId).order("created_at"),
    ]);
    const evs = (data as Ev[]) ?? [];
    setEvents(evs);
    setGroups((g as Group[]) ?? []);
    if (evs.length) {
      const { data: r } = await supabase.from("event_rsvp").select("event_id,member_name,status").in("event_id", evs.map((e) => e.id));
      setRsvps((r as Rsvp[]) ?? []);
    } else setRsvps([]);
  }, [supabase, coachId]);
  useEffect(() => { load(); }, [load]);

  const groupName = (id: string | null) => groups.find((g) => g.id === id)?.name;

  const create = async () => {
    if (!form.title.trim() || !form.starts_at) return;
    setBusy(true);
    const { error } = await supabase.from("coach_events").insert({
      coach_id: coachId, title: form.title.trim(), starts_at: new Date(form.starts_at).toISOString(),
      place: form.place.trim() || null, body: form.body.trim() || null,
      capacity: form.capacity ? Number(form.capacity) : null,
      group_id: form.group_id || null,
    });
    setBusy(false);
    if (error) { alert("Nepodařilo se vytvořit: " + error.message); return; }
    setForm({ title: "", starts_at: "", place: "", capacity: "", body: "", group_id: "" }); setOpen(false); load();
  };
  const del = async (id: string) => { if (!confirm("Smazat akci?")) return; await supabase.from("coach_events").delete().eq("id", id); load(); };

  const goingOf = (id: string) => rsvps.filter((r) => r.event_id === id && r.status === "going");
  const shown = filter === "all" ? events : events.filter((e) => e.group_id === filter);

  return (
    <div className="acct-card">
      <div className="acct-card-head" style={{ justifyContent: "space-between" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: ".5rem" }}><CalendarDays size={20} /><h2 style={{ margin: 0 }}>Akce a kalendář</h2></span>
        <button className="btn btn-green btn-sm" onClick={() => setOpen(true)}><Plus size={15} /> Nová akce</button>
      </div>
      <p className="member-note" style={{ marginTop: "-0.3rem" }}>Soustředění, náhradní trénink, turnaj… Nastav kapacitu a rodiče se přihlásí jedním klikem.</p>

      {groups.length > 0 && (
        <div className="akce-filter">
          <button className={`akce-fbtn${filter === "all" ? " on" : ""}`} onClick={() => setFilter("all")}>Vše</button>
          {groups.map((g) => <button key={g.id} className={`akce-fbtn${filter === g.id ? " on" : ""}`} onClick={() => setFilter(g.id)}>{g.name}</button>)}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="member-note" style={{ marginTop: "1rem" }}>{events.length === 0 ? "Zatím žádná akce. Vytvoř první." : "V téhle skupině žádná akce."}</p>
      ) : (
        <div className="akce-list">
          {shown.map((e) => {
            const going = goingOf(e.id);
            const full = e.capacity != null && going.length >= e.capacity;
            return (
              <div className="akce-item" key={e.id}>
                <div className="akce-h">
                  <b>{e.title}</b>
                  {groupName(e.group_id) && <span className="akce-grp"><Folder size={12} /> {groupName(e.group_id)}</span>}
                  <span className={`akce-cap${full ? " full" : ""}`}><Users size={13} /> {going.length}{e.capacity != null ? ` / ${e.capacity}` : ""}</span>
                  <button className="linklike danger" onClick={() => del(e.id)} title="Smazat"><Trash2 size={14} /></button>
                </div>
                <div className="akce-meta"><CalendarDays size={13} /> {fmtD(e.starts_at)}{e.place && <> · <MapPin size={13} /> {e.place}</>}</div>
                {e.body && <p className="akce-body">{e.body}</p>}
                {going.length > 0 && <div className="akce-going">Přihlášeni: {going.map((r) => r.member_name || "Rodič").join(", ")}</div>}
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div className="mc-modal" onClick={() => setOpen(false)}>
          <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
            <button className="mc-x" onClick={() => setOpen(false)}><X size={18} /></button>
            <h3>Nová akce</h3>
            <label>Název<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Náhradní trénink" /></label>
            <div className="mc-row2">
              <label>Kdy<input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></label>
              <label>Kapacita (nepovinné)<input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="neomezeno" /></label>
            </div>
            <label>Místo<input value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} placeholder="Kurt 2, hala…" /></label>
            <label>Komu (skupina)
              <select value={form.group_id} onChange={(e) => setForm({ ...form, group_id: e.target.value })}>
                <option value="">Celá komunita</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </label>
            <label>Popis (nepovinné)<textarea rows={2} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>
            <button className="btn btn-green" onClick={create} disabled={busy || !form.title.trim() || !form.starts_at}>Vytvořit akci</button>
          </div>
        </div>
      )}
    </div>
  );
}
