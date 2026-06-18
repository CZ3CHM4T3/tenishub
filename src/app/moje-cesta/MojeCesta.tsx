"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";
import {
  Route, Plus, ChevronLeft, ChevronRight, Trophy, Target, Trash2,
  CalendarDays, BarChart3, Lock, X,
} from "lucide-react";

/* ---------- typy ---------- */
type Player = { id: string; name: string; level: "hobby" | "competitive"; birth_year: number | null };
type EvType = { key: string; label: string; color: string };
type PhaseT = { kind: string; label: string; color: string; start: string; end: string };
type Ev = {
  id: string; player_id: string; date: string; type: string; title: string | null;
  location: string | null; link: string | null; notes: string | null;
  opponent: string | null; score: string | null; win: boolean | null;
};
type Goal = { id: string; player_id: string; title: string; target: string | null; progress: number; done: boolean };
type Seg = PhaseT & { s: Date; e: Date };

/* ---------- pomocné ---------- */
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const MONTHS = ["leden", "únor", "březen", "duben", "květen", "červen", "červenec", "srpen", "září", "říjen", "listopad", "prosinec"];
const WD = ["po", "út", "st", "čt", "pá", "so", "ne"];
const md = (s: string) => { const [m, d] = s.split("-").map(Number); return { m, d }; };

function seasonSegments(template: PhaseT[]): Seg[] {
  const now = new Date();
  const baseYear = now.getMonth() >= 10 ? now.getFullYear() : now.getFullYear() - 1;
  let curYear = baseYear;
  let prev: Date | null = null;
  return template.map((p) => {
    const ps = md(p.start), pe = md(p.end);
    let s = new Date(curYear, ps.m - 1, ps.d);
    if (prev && s <= prev) { curYear++; s = new Date(curYear, ps.m - 1, ps.d); }
    prev = s;
    let e = new Date(curYear, pe.m - 1, pe.d);
    if (e < s) e = new Date(curYear + 1, pe.m - 1, pe.d);
    return { ...p, s, e };
  });
}

export default function MojeCesta() {
  const [gate, setGate] = useState<"loading" | "noauth" | "nomember" | "ok">("loading");
  const [players, setPlayers] = useState<Player[]>([]);
  const [pid, setPid] = useState<string | null>(null);
  const [evTypes, setEvTypes] = useState<EvType[]>([]);
  const [template, setTemplate] = useState<PhaseT[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [busy, setBusy] = useState(false);

  // modály
  const [newPlayer, setNewPlayer] = useState<{ open: boolean; name: string; level: "hobby" | "competitive"; year: string }>({ open: false, name: "", level: "hobby", year: "" });
  const [evForm, setEvForm] = useState<Partial<Ev> & { open: boolean }>({ open: false });
  const [goalForm, setGoalForm] = useState<{ open: boolean; title: string; target: string }>({ open: false, title: "", target: "" });

  const supabase = useMemo(() => createClient(), []);

  const loadPlayerData = useCallback(async (playerId: string) => {
    const [e, g] = await Promise.all([
      supabase.from("cesta_events").select("*").eq("player_id", playerId).order("date"),
      supabase.from("cesta_goals").select("*").eq("player_id", playerId).order("created_at"),
    ]);
    setEvents((e.data as Ev[]) ?? []);
    setGoals((g.data as Goal[]) ?? []);
  }, [supabase]);

  const init = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setGate("noauth"); return; }
    const prof = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    const isAdmin = prof.data?.is_admin === true;
    const m = await supabase.from("memberships").select("id").eq("profile_id", user.id)
      .eq("status", "active").gt("expires_at", new Date().toISOString()).limit(1).maybeSingle();
    if (!m.data && !isAdmin) { setGate("nomember"); return; }

    const [pl, st] = await Promise.all([
      supabase.from("cesta_players").select("id,name,level,birth_year").order("created_at"),
      supabase.from("cesta_settings").select("event_types,season_template").eq("id", 1).maybeSingle(),
    ]);
    setEvTypes((st.data?.event_types as EvType[]) ?? []);
    setTemplate((st.data?.season_template as PhaseT[]) ?? []);
    const list = (pl.data as Player[]) ?? [];
    setPlayers(list);
    if (list.length) { setPid(list[0].id); await loadPlayerData(list[0].id); }
    setGate("ok");
  }, [supabase, loadPlayerData]);

  useEffect(() => { init(); }, [init]);

  const selectPlayer = async (id: string) => { setPid(id); await loadPlayerData(id); };

  const createPlayer = async () => {
    if (!newPlayer.name.trim()) return;
    setBusy(true);
    const { data } = await supabase.from("cesta_players").insert({
      name: newPlayer.name.trim(), level: newPlayer.level,
      birth_year: newPlayer.year ? Number(newPlayer.year) : null,
    }).select("id,name,level,birth_year").single();
    if (data) {
      setPlayers((p) => [...p, data as Player]);
      setPid((data as Player).id);
      setEvents([]); setGoals([]);
    }
    setNewPlayer({ open: false, name: "", level: "hobby", year: "" });
    setBusy(false);
  };

  const saveEvent = async () => {
    if (!pid || !evForm.date) return;
    setBusy(true);
    const payload = {
      player_id: pid, date: evForm.date, type: evForm.type || "training",
      title: evForm.title || null, location: evForm.location || null, link: evForm.link || null,
      notes: evForm.notes || null, opponent: evForm.opponent || null, score: evForm.score || null,
      win: evForm.win ?? null,
    };
    if (evForm.id) await supabase.from("cesta_events").update(payload).eq("id", evForm.id);
    else await supabase.from("cesta_events").insert(payload);
    await loadPlayerData(pid);
    setEvForm({ open: false });
    setBusy(false);
  };
  const deleteEvent = async (id: string) => {
    if (!pid) return;
    setBusy(true);
    await supabase.from("cesta_events").delete().eq("id", id);
    await loadPlayerData(pid);
    setEvForm({ open: false });
    setBusy(false);
  };

  const addGoal = async () => {
    if (!pid || !goalForm.title.trim()) return;
    setBusy(true);
    await supabase.from("cesta_goals").insert({ player_id: pid, title: goalForm.title.trim(), target: goalForm.target || null });
    await loadPlayerData(pid);
    setGoalForm({ open: false, title: "", target: "" });
    setBusy(false);
  };
  const setGoalProgress = async (g: Goal, progress: number) => {
    await supabase.from("cesta_goals").update({ progress, done: progress >= 100 }).eq("id", g.id);
    if (pid) await loadPlayerData(pid);
  };
  const delGoal = async (id: string) => {
    await supabase.from("cesta_goals").delete().eq("id", id);
    if (pid) await loadPlayerData(pid);
  };

  /* ---------- odvozené ---------- */
  const segs = useMemo(() => seasonSegments(template), [template]);
  const typeOf = useCallback((k: string) => evTypes.find((t) => t.key === k) ?? { key: k, label: k, color: "#9aa3ad" }, [evTypes]);
  const player = players.find((p) => p.id === pid) ?? null;

  const seasonStats = useMemo(() => {
    if (!segs.length) return null;
    const s0 = segs[0].s, e0 = segs[segs.length - 1].e;
    const inSeason = events.filter((e) => { const d = new Date(e.date); return d >= s0 && d <= e0; });
    const trainings = inSeason.filter((e) => e.type === "training").length;
    const tournaments = inSeason.filter((e) => e.type === "tournament");
    const wins = tournaments.filter((e) => e.win === true).length;
    const losses = tournaments.filter((e) => e.win === false).length;
    const rest = inSeason.filter((e) => e.type === "rest" || e.type === "recovery").length;
    return { trainings, tournaments: tournaments.length, wins, losses, rest, total: inSeason.length };
  }, [events, segs]);

  // kalendář (po–ne)
  const grid = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7; // pondělí = 0
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month]);
  const evByDay = useMemo(() => {
    const m: Record<string, Ev[]> = {};
    for (const e of events) (m[e.date] ??= []).push(e);
    return m;
  }, [events]);

  const todayISO = iso(new Date());
  const nowPct = useMemo(() => {
    if (!segs.length) return null;
    const a = segs[0].s.getTime(), b = segs[segs.length - 1].e.getTime(), n = Date.now();
    if (n < a || n > b) return null;
    return ((n - a) / (b - a)) * 100;
  }, [segs]);

  /* ---------- gating obrazovky ---------- */
  if (gate === "loading") return <div className="acct-loading">Načítám Moji cestu…</div>;

  const Shell = (inner: React.ReactNode) => (
    <div className="acct-page">
      <header className="subhdr"><div className="wrap"><div className="bar">
        <Link href="/" className="brand"><Wordmark /></Link>
        <Link href="/ucet" className="back">← Můj účet</Link>
      </div></div></header>
      <div className="wrap acct-wrap">{inner}</div>
    </div>
  );

  if (gate === "noauth") return Shell(
    <div className="acct-card mc-gate">
      <Route size={34} />
      <h1>Moje cesta</h1>
      <p>Sezónní průvodce pro tebe i tvé dítě. Přihlas se a začni plánovat.</p>
      <Link href="/prihlaseni?next=/moje-cesta" className="btn btn-green">Přihlásit se</Link>
    </div>
  );
  if (gate === "nomember") return Shell(
    <div className="acct-card mc-gate">
      <Lock size={34} />
      <h1>Moje cesta je součást HUB+</h1>
      <p>Naplánuj celou sezónu — tréninky, turnaje, kondici i volno — a sleduj cíle a statistiky. Aktivuj HUB+ a máš to odemčené.</p>
      <Link href="/ucet" className="btn btn-gold">Chci HUB+</Link>
    </div>
  );

  return Shell(<>
    <div className="mc-head">
      <h1 className="acct-h1"><Route size={26} style={{ verticalAlign: "-4px" }} /> Moje cesta</h1>
      <div className="mc-players">
        {players.map((p) => (
          <button key={p.id} className={`mc-ptab${p.id === pid ? " on" : ""}`} onClick={() => selectPlayer(p.id)}>
            {p.name} <span className="mc-lvl">{p.level === "competitive" ? "závodní" : "hobby"}</span>
          </button>
        ))}
        <button className="mc-ptab mc-padd" onClick={() => setNewPlayer((s) => ({ ...s, open: true }))}><Plus size={15} /> Hráč</button>
      </div>
    </div>

    {!player ? (
      <div className="acct-card mc-gate">
        <Route size={30} />
        <h2>Založ si prvního hráče</h2>
        <p>Může to být tvé dítě (spravuješ ho ty) i ty sám. Pak naplánuješ celou sezónu.</p>
        <button className="btn btn-green" onClick={() => setNewPlayer((s) => ({ ...s, open: true }))}><Plus size={16} /> Přidat hráče</button>
      </div>
    ) : (<>
      {/* OSA SEZÓNY */}
      <div className="acct-card mc-season">
        <div className="acct-card-head"><CalendarDays size={20} /><h2>Sezóna {player.name}</h2></div>
        <div className="mc-axis">
          {segs.map((s, i) => {
            const total = segs[segs.length - 1].e.getTime() - segs[0].s.getTime();
            const w = ((s.e.getTime() - s.s.getTime()) / total) * 100;
            const here = Date.now() >= s.s.getTime() && Date.now() <= s.e.getTime();
            return (
              <div key={i} className={`mc-seg${here ? " here" : ""}`} style={{ width: `${w}%`, background: s.color }}>
                <span>{s.label}</span>
              </div>
            );
          })}
          {nowPct != null && <div className="mc-now" style={{ left: `${nowPct}%` }} title="Jsi tady" />}
        </div>
      </div>

      {/* STATISTIKY */}
      {seasonStats && (
        <div className="mc-stats">
          <div className="mc-stat"><BarChart3 size={16} /><b>{seasonStats.trainings}</b><span>tréninků</span></div>
          <div className="mc-stat"><Trophy size={16} /><b>{seasonStats.tournaments}</b><span>turnajů</span></div>
          <div className="mc-stat"><b>{seasonStats.wins}–{seasonStats.losses}</b><span>výhry–prohry</span></div>
          <div className="mc-stat"><b>{seasonStats.rest}</b><span>regenerace / volno</span></div>
        </div>
      )}

      <div className="mc-cols">
        {/* KALENDÁŘ */}
        <div className="acct-card mc-cal">
          <div className="mc-calhead">
            <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Předchozí měsíc"><ChevronLeft size={18} /></button>
            <h2>{MONTHS[month.getMonth()]} {month.getFullYear()}</h2>
            <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Další měsíc"><ChevronRight size={18} /></button>
          </div>
          <div className="mc-grid mc-wdrow">{WD.map((w) => <span key={w} className="mc-wd">{w}</span>)}</div>
          <div className="mc-grid">
            {grid.map((d, i) => {
              if (!d) return <span key={i} className="mc-cell empty" />;
              const k = iso(d);
              const evs = evByDay[k] ?? [];
              return (
                <button key={i} className={`mc-cell${k === todayISO ? " today" : ""}`}
                  onClick={() => setEvForm({ open: true, date: k, type: evTypes[0]?.key ?? "training" })}>
                  <span className="mc-daynum">{d.getDate()}</span>
                  <span className="mc-dots">
                    {evs.slice(0, 4).map((e) => (
                      <i key={e.id} title={typeOf(e.type).label + (e.title ? ` — ${e.title}` : "")}
                        style={{ background: typeOf(e.type).color }}
                        onClick={(ev) => { ev.stopPropagation(); setEvForm({ open: true, ...e }); }} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mc-legend">
            {evTypes.map((t) => <span key={t.key}><i style={{ background: t.color }} />{t.label}</span>)}
          </div>
        </div>

        {/* CÍLE */}
        <div className="acct-card mc-goals">
          <div className="acct-card-head"><Target size={20} /><h2>Cíle sezóny</h2>
            <button className="btn btn-out btn-sm" style={{ marginLeft: "auto" }} onClick={() => setGoalForm({ open: true, title: "", target: "" })}><Plus size={14} /> Cíl</button>
          </div>
          {goals.length === 0 ? <p className="member-note">Zatím žádný cíl. Co chceš tuhle sezónu dokázat?</p> : (
            <ul className="mc-goallist">
              {goals.map((g) => (
                <li key={g.id} className={g.done ? "done" : ""}>
                  <div className="mc-goaltop">
                    <b>{g.title}</b>
                    <button className="linklike danger" onClick={() => delGoal(g.id)}><Trash2 size={14} /></button>
                  </div>
                  {g.target && <span className="mc-goaltarget">{g.target}</span>}
                  <div className="mc-prog"><div style={{ width: `${g.progress}%` }} /></div>
                  <div className="mc-progbtns">
                    {[0, 25, 50, 75, 100].map((v) => (
                      <button key={v} className={g.progress === v ? "on" : ""} onClick={() => setGoalProgress(g, v)}>{v}%</button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>)}

    {/* MODÁL: nový hráč */}
    {newPlayer.open && (
      <div className="mc-modal" onClick={() => setNewPlayer((s) => ({ ...s, open: false }))}>
        <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
          <button className="mc-x" onClick={() => setNewPlayer((s) => ({ ...s, open: false }))}><X size={18} /></button>
          <h3>Nový hráč</h3>
          <label>Jméno<input value={newPlayer.name} onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })} placeholder="Např. Klárka / Já" /></label>
          <label>Úroveň
            <select value={newPlayer.level} onChange={(e) => setNewPlayer({ ...newPlayer, level: e.target.value as "hobby" | "competitive" })}>
              <option value="hobby">Hobby</option>
              <option value="competitive">Závodní</option>
            </select>
          </label>
          <label>Rok narození (nepovinné)<input value={newPlayer.year} onChange={(e) => setNewPlayer({ ...newPlayer, year: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="2014" /></label>
          <button className="btn btn-green" disabled={busy} onClick={createPlayer}>Přidat hráče</button>
        </div>
      </div>
    )}

    {/* MODÁL: událost */}
    {evForm.open && (
      <div className="mc-modal" onClick={() => setEvForm({ open: false })}>
        <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
          <button className="mc-x" onClick={() => setEvForm({ open: false })}><X size={18} /></button>
          <h3>{evForm.id ? "Upravit událost" : "Nová událost"} <span className="mc-modal-date">{evForm.date}</span></h3>
          <label>Typ
            <select value={evForm.type ?? "training"} onChange={(e) => setEvForm({ ...evForm, type: e.target.value })}>
              {evTypes.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </label>
          <label>Název / popis<input value={evForm.title ?? ""} onChange={(e) => setEvForm({ ...evForm, title: e.target.value })} placeholder="Trénink s trenérem, turnaj…" /></label>
          <label>Místo<input value={evForm.location ?? ""} onChange={(e) => setEvForm({ ...evForm, location: e.target.value })} placeholder="Kurt / hala" /></label>
          <label>Odkaz<input value={evForm.link ?? ""} onChange={(e) => setEvForm({ ...evForm, link: e.target.value })} placeholder="https://…" /></label>
          {evForm.type === "tournament" && (<>
            <label>Soupeř<input value={evForm.opponent ?? ""} onChange={(e) => setEvForm({ ...evForm, opponent: e.target.value })} /></label>
            <div className="mc-row2">
              <label>Skóre<input value={evForm.score ?? ""} onChange={(e) => setEvForm({ ...evForm, score: e.target.value })} placeholder="6:3 6:4" /></label>
              <label>Výsledek
                <select value={evForm.win === true ? "w" : evForm.win === false ? "l" : ""} onChange={(e) => setEvForm({ ...evForm, win: e.target.value === "w" ? true : e.target.value === "l" ? false : null })}>
                  <option value="">—</option><option value="w">Výhra</option><option value="l">Prohra</option>
                </select>
              </label>
            </div>
          </>)}
          <label>Poznámka<textarea value={evForm.notes ?? ""} onChange={(e) => setEvForm({ ...evForm, notes: e.target.value })} rows={2} /></label>
          <div className="mc-modal-actions">
            {evForm.id && <button className="btn btn-out danger" onClick={() => deleteEvent(evForm.id!)}><Trash2 size={14} /> Smazat</button>}
            <button className="btn btn-green" disabled={busy} onClick={saveEvent}>Uložit</button>
          </div>
        </div>
      </div>
    )}

    {/* MODÁL: cíl */}
    {goalForm.open && (
      <div className="mc-modal" onClick={() => setGoalForm({ open: false, title: "", target: "" })}>
        <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
          <button className="mc-x" onClick={() => setGoalForm({ open: false, title: "", target: "" })}><X size={18} /></button>
          <h3>Nový cíl sezóny</h3>
          <label>Cíl<input value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} placeholder="Naučit se podání, postup v žebříčku…" /></label>
          <label>Měřítko (nepovinné)<input value={goalForm.target} onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })} placeholder="Do TOP 50, 3 turnaje…" /></label>
          <button className="btn btn-green" disabled={busy} onClick={addGoal}>Přidat cíl</button>
        </div>
      </div>
    )}
  </>);
}
