"use client";

// Osobní kalendář v účtu: rezervace + vlastní barevné akce (název + libovolná barva).
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CalendarCheck, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

type Ev = { id: string; title: string; event_date: string; color: string };
type Booking = { id: string; starts_at: string; price_czk: number | null; status: string };

const MONTHS = ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"];
const DOW = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const SWATCHES = ["#2c4a3b", "#bf9a47", "#7C4DD6", "#3b8a5a", "#864a59", "#3b6ea5", "#b06a2c", "#8a5640"];
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function Kalendar({ userId }: { userId: string }) {
  const today = new Date();
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [events, setEvents] = useState<Ev[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [modal, setModal] = useState<{ date: string } | null>(null);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("#2c4a3b");
  const [busy, setBusy] = useState(false);
  const [hasTable, setHasTable] = useState(true);

  const load = useCallback(async () => {
    const sb = createClient();
    const b = await sb.from("bookings").select("id,starts_at,price_czk,status").eq("customer_id", userId).order("starts_at");
    setBookings((b.data as Booking[]) ?? []);
    const e = await sb.from("calendar_events").select("id,title,event_date,color").eq("user_id", userId);
    if (e.error) { setHasTable(false); return; }
    setHasTable(true);
    setEvents((e.data as Ev[]) ?? []);
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!modal || !title.trim()) return;
    setBusy(true);
    const sb = createClient();
    const { error } = await sb.from("calendar_events").insert({ user_id: userId, title: title.trim(), event_date: modal.date, color });
    setBusy(false);
    if (error) { alert("Uložení selhalo: " + error.message); return; }
    setModal(null); setTitle(""); setColor("#2c4a3b");
    load();
  };
  const del = async (id: string) => {
    const sb = createClient();
    await sb.from("calendar_events").delete().eq("id", id);
    load();
  };

  const first = new Date(ym.y, ym.m, 1);
  const startDow = (first.getDay() + 6) % 7; // pondělí = 0
  const daysIn = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const evByDay = (d: number) => {
    const key = ymd(new Date(ym.y, ym.m, d));
    const bk = bookings.filter((b) => ymd(new Date(b.starts_at)) === key).map((b) => ({ id: "b" + b.id, title: b.status === "paid" ? "Rezervace ✓" : "Rezervace", color: "#3b6ea5", ev: false }));
    const custom = events.filter((e) => e.event_date === key).map((e) => ({ id: e.id, title: e.title, color: e.color, ev: true }));
    return [...bk, ...custom];
  };

  const prev = () => setYm((p) => p.m === 0 ? { y: p.y - 1, m: 11 } : { y: p.y, m: p.m - 1 });
  const next = () => setYm((p) => p.m === 11 ? { y: p.y + 1, m: 0 } : { y: p.y, m: p.m + 1 });
  const isToday = (d: number) => today.getFullYear() === ym.y && today.getMonth() === ym.m && today.getDate() === d;

  return (
    <div className="acct-card">
      <div className="acct-card-head"><CalendarCheck size={20} /><h2>Kalendář</h2></div>
      {!hasTable && <p className="member-note" style={{ color: "var(--gold)" }}>Vlastní akce se zapnou po spuštění SQL <code>calendar_events</code>. Rezervace se zobrazují už teď.</p>}

      <div className="cal-bar">
        <button className="cal-nav" onClick={prev} type="button" aria-label="Předchozí měsíc"><ChevronLeft size={18} /></button>
        <b className="cal-title">{MONTHS[ym.m]} {ym.y}</b>
        <button className="cal-nav" onClick={next} type="button" aria-label="Další měsíc"><ChevronRight size={18} /></button>
      </div>

      <div className="cal-grid cal-dow">
        {DOW.map((d) => <span key={d} className="cal-dowc">{d}</span>)}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => (
          <div key={i} className={`cal-cell${d === null ? " cal-empty" : ""}${d && isToday(d) ? " cal-today" : ""}`}
            onClick={() => d && setModal({ date: ymd(new Date(ym.y, ym.m, d)) })}>
            {d && (<>
              <span className="cal-day">{d}</span>
              <div className="cal-evs">
                {evByDay(d).map((e) => (
                  <span key={e.id} className="cal-chip" style={{ background: e.color }} title={e.title}
                    onClick={(ev) => { ev.stopPropagation(); if (e.ev && confirm(`Smazat akci „${e.title}"?`)) del(e.id); }}>
                    {e.title}
                  </span>
                ))}
              </div>
            </>)}
          </div>
        ))}
      </div>
      <p className="hint" style={{ marginTop: ".6rem" }}>Klikni na den a přidej vlastní akci (název + libovolná barva). Rezervace jsou modře; vlastní akci smažeš kliknutím na ni.</p>

      {modal && (
        <div className="mc-modal" onClick={() => setModal(null)}>
          <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
            <button className="mc-x" onClick={() => setModal(null)} type="button"><X size={18} /></button>
            <h3>Nová akce · {modal.date.split("-").reverse().join(". ")}</h3>
            <label>Název<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Např. Trénink, Turnaj, Volno…" autoFocus /></label>
            <label>Barva
              <div className="cal-colors">
                {SWATCHES.map((c) => <button key={c} type="button" className={`cal-sw${color === c ? " on" : ""}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={`Barva ${c}`} />)}
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="cal-colorpick" aria-label="Vlastní barva" />
              </div>
            </label>
            <button className="btn btn-green" disabled={busy || !title.trim()} onClick={add} type="button"><Plus size={15} /> Přidat akci</button>
          </div>
        </div>
      )}
    </div>
  );
}
