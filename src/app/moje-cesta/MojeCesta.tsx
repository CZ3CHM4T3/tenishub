"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";
import {
  Route, Plus, ChevronLeft, ChevronRight, Target, Trash2, Pencil,
  CalendarDays, CalendarRange, Grid3x3, TrendingUp, Lock, X,
  History, Users, Lightbulb, SlidersHorizontal, RefreshCw, Check,
} from "lucide-react";

/* ---------- typy ---------- */
type Player = { id: string; name: string; level: "hobby" | "competitive"; birth_year: number | null; category: string | null; ranking: number | null; cts_id: string | null };
type EvType = { key: string; label: string; color: string };
type PhaseT = { kind: string; label: string; color: string; start: string; end: string };
type SetScore = { me: number; opp: number };
type Ev = {
  id: string; player_id: string; date: string; type: string; title: string | null;
  location: string | null; link: string | null; notes: string | null;
  opponent: string | null; score: string | null; win: boolean | null; sets: SetScore[] | null;
  surface: string | null;
};
type Metrics = {
  trainings: number; tournaments: number; played: number; wins: number; losses: number;
  winPct: number | null; firstSetPct: number | null; closePct: number | null; comebackPct: number | null;
  threeW: number; threeL: number;
};
type Goal = { id: string; player_id: string; title: string; target: string | null; progress: number; done: boolean };
type Seg = PhaseT & { s: Date; e: Date };
type View = "month" | "week" | "year" | "load" | "reflect";
type PForm = { open: boolean; id?: string; name: string; level: "hobby" | "competitive"; year: string; category: string; ranking: string; cts: string };

/* ---------- pomocné ---------- */
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const MONTHS = ["leden", "únor", "březen", "duben", "květen", "červen", "červenec", "srpen", "září", "říjen", "listopad", "prosinec"];
const MON3 = ["led", "úno", "bře", "dub", "kvě", "čvn", "čvc", "srp", "zář", "říj", "lis", "pro"];
const WD = ["po", "út", "st", "čt", "pá", "so", "ne"];
const md = (s: string) => { const [m, d] = s.split("-").map(Number); return { m, d }; };
const PCLOSED: PForm = { open: false, name: "", level: "hobby", year: "", category: "", ranking: "", cts: "" };
const SURFACES: [string, string][] = [["", "—"], ["antuka", "Antuka"], ["hard", "Tvrdý / umělý"], ["koberec", "Koberec"], ["trava", "Tráva"], ["hala", "Hala (krytá)"]];
const surfLabel = (k: string | null | undefined) => SURFACES.find(([v]) => v === (k ?? ""))?.[1] ?? "—";
type StatA = { trainings: number; tournaments: number; wins: number; losses: number; rest: number; winPct: number | null; firstSetPct: number | null; closePct: number | null; comebackPct: number | null; bestSurface: string };
const METRIC_DEFS: { key: string; label: string; fmt: (a: StatA) => string }[] = [
  { key: "trainings", label: "Tréninků", fmt: (a) => String(a.trainings) },
  { key: "tournaments", label: "Turnajů", fmt: (a) => String(a.tournaments) },
  { key: "winloss", label: "Výhry–prohry", fmt: (a) => `${a.wins}–${a.losses}` },
  { key: "winPct", label: "Úspěšnost", fmt: (a) => a.winPct != null ? `${a.winPct} %` : "—" },
  { key: "firstSetPct", label: "Vyhraný 1. set", fmt: (a) => a.firstSetPct != null ? `${a.firstSetPct} %` : "—" },
  { key: "closePct", label: "Dotažení", fmt: (a) => a.closePct != null ? `${a.closePct} %` : "—" },
  { key: "comebackPct", label: "Otočky", fmt: (a) => a.comebackPct != null ? `${a.comebackPct} %` : "—" },
  { key: "rest", label: "Regenerace / volno", fmt: (a) => String(a.rest) },
  { key: "bestSurface", label: "Nejlepší povrch", fmt: (a) => a.bestSurface },
];
const DEFAULT_STATS = ["trainings", "tournaments", "winloss", "winPct"];
function weekStart(d: Date) { const x = new Date(d); const off = (x.getDay() + 6) % 7; x.setDate(x.getDate() - off); x.setHours(0, 0, 0, 0); return x; }

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

/* ---------- analýza zápasů ---------- */
const setsOf = (e: Ev): SetScore[] => Array.isArray(e.sets) ? e.sets : [];
const hasResult = (e: Ev) => e.type === "tournament" && (e.win != null || setsOf(e).length > 0);
const matchWin = (e: Ev): boolean => {
  if (e.win != null) return e.win;
  const s = setsOf(e); const w = s.filter((x) => x.me > x.opp).length, l = s.filter((x) => x.opp > x.me).length;
  return w > l;
};
const wonFirstSet = (e: Ev): boolean | null => { const s = setsOf(e); return s.length ? s[0].me > s[0].opp : null; };
const pct = (a: number, b: number) => b ? Math.round((a / b) * 100) : null;

function computeMetrics(evs: Ev[]): Metrics {
  const trainings = evs.filter((e) => e.type === "training").length;
  const tournaments = evs.filter((e) => e.type === "tournament").length;
  const played = evs.filter(hasResult);
  const wins = played.filter(matchWin).length;
  const losses = played.length - wins;
  let fsW = 0, fsT = 0, clW = 0, clT = 0, cbW = 0, cbT = 0, threeW = 0, threeL = 0;
  for (const e of played) {
    const wf = wonFirstSet(e); const win = matchWin(e);
    if (wf != null) { fsT++; if (wf) fsW++; if (wf) { clT++; if (win) clW++; } else { cbT++; if (win) cbW++; } }
    if (setsOf(e).length >= 3) { if (win) threeW++; else threeL++; }
  }
  return {
    trainings, tournaments, played: played.length, wins, losses,
    winPct: pct(wins, played.length), firstSetPct: pct(fsW, fsT),
    closePct: pct(clW, clT), comebackPct: pct(cbW, cbT), threeW, threeL,
  };
}

function insights(
  m: Metrics, bestMonth: { idx: number; p: number } | null, monthName: string,
  surfRows: { label: string; w: number; t: number; p: number }[] = []
): string[] {
  const out: string[] = [];
  if (m.played < 3) {
    out.push("Zatím je tu málo odehraných zápasů. Vyplň u turnajů skóre po setech (a povrch) — z toho ti pak vyskočí, kdy vyhráváš nejvíc, jak dotahuješ vedené zápasy i kde tě tlačí bota.");
    return out;
  }
  if (bestMonth && bestMonth.p >= 50) out.push(`Forma ti nejvíc sedí v měsíci ${monthName} — ${bestMonth.p} % výher. Naplánuj si na tu dobu důležité turnaje.`);
  if (m.closePct != null && m.firstSetPct != null) {
    if (m.closePct < 55) out.push(`Vyhraješ první set ve ${m.firstSetPct} % zápasů, ale dotáhneš jen ${m.closePct} % z nich — vedení ti utíká. Trénuj koncentraci za stavu, kdy vedeš, a uzavírání zápasu.`);
    else if (m.closePct >= 75) out.push(`Když vedeš po prvním setu, zápas spolehlivě dovedeš do konce (${m.closePct} %). Silná hlava ve vedení.`);
  }
  if (m.comebackPct != null) {
    if (m.comebackPct >= 35) out.push(`Umíš to otočit — i po prohraném prvním setu bereš ${m.comebackPct} % zápasů. Bojovnost ti nechybí.`);
    else if (m.comebackPct === 0 && m.closePct != null) out.push("Po ztraceném prvním setu se ti zápas otočit zatím nedaří. Stojí za to pracovat s restartem hlavy mezi sety.");
  }
  if (m.threeW + m.threeL >= 2) out.push(`Třísetové bitvy: ${m.threeW}–${m.threeL}. ${m.threeW >= m.threeL ? "Koncovky a kondice na konci zápasu zvládáš." : "Konce dlouhých zápasů = prostor ke zlepšení (kondice, nervy)."}`);
  const ranked = surfRows.filter((s) => s.t >= 2).sort((a, b) => b.p - a.p);
  if (ranked.length >= 2) out.push(`Povrch hraje roli: nejlíp se ti daří na ${ranked[0].label} (${ranked[0].p} %), nejhůř na ${ranked[ranked.length - 1].label} (${ranked[ranked.length - 1].p} %).`);
  return out.slice(0, 4);
}

export default function MojeCesta() {
  const [gate, setGate] = useState<"loading" | "noauth" | "nomember" | "ok">("loading");
  const [uid, setUid] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [pid, setPid] = useState<string | null>(null);
  const [evTypes, setEvTypes] = useState<EvType[]>([]);
  const [template, setTemplate] = useState<PhaseT[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [view, setView] = useState<View>("month");
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [weekRef, setWeekRef] = useState(() => weekStart(new Date()));
  const [busy, setBusy] = useState(false);

  const [compareOpen, setCompareOpen] = useState(false);
  const [allEv, setAllEv] = useState<Ev[]>([]);
  const [statKeys, setStatKeys] = useState<string[]>(DEFAULT_STATS);
  const [showStatCfg, setShowStatCfg] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [pForm, setPForm] = useState<PForm>(PCLOSED);
  const [evForm, setEvForm] = useState<Partial<Ev> & { open: boolean }>({ open: false });
  const [goalForm, setGoalForm] = useState<{ open: boolean; title: string; target: string }>({ open: false, title: "", target: "" });

  const supabase = useMemo(() => createClient(), []);
  const PSEL = "id,name,level,birth_year,category,ranking,cts_id";

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
    setUid(user.id);
    const prof = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    const isAdmin = prof.data?.is_admin === true;
    const m = await supabase.from("memberships").select("id").eq("profile_id", user.id)
      .eq("status", "active").gt("expires_at", new Date().toISOString()).limit(1).maybeSingle();
    if (!m.data && !isAdmin) { setGate("nomember"); return; }

    const [pl, st] = await Promise.all([
      supabase.from("cesta_players").select(PSEL).order("created_at"),
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
  useEffect(() => { try { const s = localStorage.getItem("mc_stats"); if (s) setStatKeys(JSON.parse(s)); } catch {} }, []);

  const [syncInput, setSyncInput] = useState("");
  const toggleStat = (k: string) => setStatKeys((prev) => {
    const next = prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k];
    try { localStorage.setItem("mc_stats", JSON.stringify(next)); } catch {}
    return next;
  });

  const syncCT = async () => {
    const q = (syncInput.trim() || pForm.cts.trim());
    if (!q) { setSyncMsg("Vlož odkaz na profil (cesky-tenis.cz) nebo číslo hráče."); return; }
    setSyncing(true); setSyncMsg(null);
    try {
      const param = /^\d+$/.test(q) ? `id=${q}` : `url=${encodeURIComponent(q)}`;
      const r = await fetch(`/api/cesky-tenis?${param}`);
      const d = await r.json();
      if (!r.ok) { setSyncMsg(d.error || "Načtení selhalo."); setSyncing(false); return; }
      setPForm((f) => ({
        ...f, level: "competitive",
        name: f.name.trim() ? f.name : (d.name || f.name),
        ranking: d.ranking != null ? String(d.ranking) : f.ranking,
        year: d.birth_year != null ? String(d.birth_year) : f.year,
        cts: d.id || f.cts,
      }));
      const bits = [d.name, d.club, d.ranking != null ? `žebříček ${d.ranking}.` : null, d.birth_year ? `*${d.birth_year}` : null].filter(Boolean);
      setSyncMsg(bits.length ? `Načteno: ${bits.join(" · ")}` : "Profil se načetl, ale údaje se nepodařilo vyčíst — zadej ručně.");
    } catch { setSyncMsg("Spojení selhalo."); }
    setSyncing(false);
  };

  const selectPlayer = async (id: string) => { setPid(id); await loadPlayerData(id); };

  const savePlayer = async () => {
    if (!pForm.name.trim() || !uid) return;
    setBusy(true);
    const payload = {
      name: pForm.name.trim(), level: pForm.level,
      birth_year: pForm.year ? Number(pForm.year) : null,
      category: pForm.category || null,
      ranking: pForm.ranking ? Number(pForm.ranking) : null,
      cts_id: pForm.cts || null,
    };
    if (pForm.id) {
      const { error } = await supabase.from("cesta_players").update(payload).eq("id", pForm.id);
      if (error) { alert("Uložení selhalo: " + error.message); setBusy(false); return; }
      setPlayers((p) => p.map((x) => x.id === pForm.id ? { ...x, ...payload } as Player : x));
    } else {
      const { data, error } = await supabase.from("cesta_players").insert({ owner_id: uid, ...payload }).select(PSEL).single();
      if (error) {
        alert("Hráče se nepodařilo přidat: " + error.message
          + "\n\n(Pokud chyba zmiňuje 'does not exist', spusť v Supabase supabase/moje-cesta.sql.)");
        setBusy(false); return;
      }
      setPlayers((p) => [...p, data as Player]);
      setPid((data as Player).id); setEvents([]); setGoals([]);
    }
    setPForm(PCLOSED); setBusy(false);
  };
  const openNewPlayer = () => { setSyncInput(""); setSyncMsg(null); setPForm({ ...PCLOSED, open: true }); };
  const editPlayer = (p: Player) => {
    setSyncInput(""); setSyncMsg(null);
    setPForm({
      open: true, id: p.id, name: p.name, level: p.level, year: p.birth_year ? String(p.birth_year) : "",
      category: p.category ?? "", ranking: p.ranking != null ? String(p.ranking) : "", cts: p.cts_id ?? "",
    });
  };
  const deletePlayer = async (p: Player) => {
    if (!confirm(`Smazat hráče „${p.name}" a celou jeho cestu? Nevratné.`)) return;
    setBusy(true);
    await supabase.from("cesta_players").delete().eq("id", p.id);
    const rest = players.filter((x) => x.id !== p.id);
    setPlayers(rest);
    setPForm(PCLOSED);
    if (pid === p.id) { const n = rest[0]?.id ?? null; setPid(n); if (n) await loadPlayerData(n); else { setEvents([]); setGoals([]); } }
    setBusy(false);
  };

  const loadCompare = async () => {
    if (players.length < 2) return;
    const { data } = await supabase.from("cesta_events").select("*").in("player_id", players.map((p) => p.id));
    setAllEv((data as Ev[]) ?? []);
    setCompareOpen(true);
  };

  const setSet = (i: number, field: "me" | "opp", val: string) => {
    const arr: SetScore[] = [...(evForm.sets ?? [])];
    while (arr.length <= i) arr.push({ me: 0, opp: 0 });
    arr[i] = { ...arr[i], [field]: val === "" ? 0 : Math.min(99, Number(val.replace(/\D/g, ""))) };
    setEvForm({ ...evForm, sets: arr });
  };

  const saveEvent = async () => {
    if (!pid || !evForm.date) return;
    setBusy(true);
    const isTour = (evForm.type || "training") === "tournament";
    const cleanSets = isTour ? (evForm.sets ?? []).filter((s) => s.me || s.opp) : [];
    const derivedWin = evForm.win ?? (cleanSets.length ? (cleanSets.filter((s) => s.me > s.opp).length > cleanSets.filter((s) => s.opp > s.me).length) : null);
    const derivedScore = cleanSets.length ? cleanSets.map((s) => `${s.me}:${s.opp}`).join(" ") : (evForm.score || null);
    const payload = {
      player_id: pid, date: evForm.date, type: evForm.type || "training",
      title: evForm.title || null, location: evForm.location || null, link: evForm.link || null,
      notes: evForm.notes || null, opponent: evForm.opponent || null, score: derivedScore,
      win: derivedWin, sets: cleanSets.length ? cleanSets : null, surface: evForm.surface || null,
    };
    if (evForm.id) await supabase.from("cesta_events").update(payload).eq("id", evForm.id);
    else await supabase.from("cesta_events").insert(payload);
    await loadPlayerData(pid);
    setEvForm({ open: false }); setBusy(false);
  };
  const deleteEvent = async (id: string) => {
    if (!pid) return;
    setBusy(true);
    await supabase.from("cesta_events").delete().eq("id", id);
    await loadPlayerData(pid);
    setEvForm({ open: false }); setBusy(false);
  };

  const addGoal = async () => {
    if (!pid || !goalForm.title.trim()) return;
    setBusy(true);
    await supabase.from("cesta_goals").insert({ player_id: pid, title: goalForm.title.trim(), target: goalForm.target || null });
    await loadPlayerData(pid);
    setGoalForm({ open: false, title: "", target: "" }); setBusy(false);
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
  const todayISO = iso(new Date());

  const evByDay = useMemo(() => {
    const m: Record<string, Ev[]> = {};
    for (const e of events) (m[e.date] ??= []).push(e);
    return m;
  }, [events]);

  const winRange = useMemo(() => {
    if (segs.length) return { s: segs[0].s, e: segs[segs.length - 1].e };
    const y = new Date().getFullYear();
    return { s: new Date(y, 0, 1), e: new Date(y, 11, 31) };
  }, [segs]);

  const seasonStats = useMemo(() => {
    const inSeason = events.filter((e) => { const d = new Date(e.date); return d >= winRange.s && d <= winRange.e; });
    const trainings = inSeason.filter((e) => e.type === "training").length;
    const tournaments = inSeason.filter((e) => e.type === "tournament");
    const wins = tournaments.filter((e) => e.win === true).length;
    const losses = tournaments.filter((e) => e.win === false).length;
    const rest = inSeason.filter((e) => e.type === "rest" || e.type === "recovery").length;
    return { trainings, tournaments: tournaments.length, wins, losses, rest };
  }, [events, winRange]);

  const reflect = useMemo(() => {
    const M = computeMetrics(events);
    const monthly = Array.from({ length: 12 }, () => ({ w: 0, t: 0 }));
    events.filter(hasResult).forEach((e) => { const mi = new Date(e.date).getMonth(); monthly[mi].t++; if (matchWin(e)) monthly[mi].w++; });
    let best: { idx: number; p: number } | null = null;
    monthly.forEach((m, i) => { if (m.t > 0) { const p = Math.round(m.w / m.t * 100); if (!best || p > best!.p) best = { idx: i, p }; } });
    // povrchy
    const surf: Record<string, { w: number; t: number }> = {};
    events.filter(hasResult).forEach((e) => { const k = e.surface || ""; if (!k) return; (surf[k] ??= { w: 0, t: 0 }).t++; if (matchWin(e)) surf[k].w++; });
    const surfRows = Object.entries(surf).map(([k, v]) => ({ k, label: surfLabel(k), w: v.w, t: v.t, p: Math.round(v.w / v.t * 100) }));
    let bestSurface = "—";
    const cand = surfRows.filter((s) => s.t >= 2).sort((a, b) => b.p - a.p)[0];
    if (cand) bestSurface = `${cand.label} (${cand.p} %)`;
    const tips = insights(M, best, best ? MONTHS[(best as { idx: number }).idx] : "", surfRows);
    return { M, monthly, best: best as { idx: number; p: number } | null, surfRows, bestSurface, tips };
  }, [events]);

  const statA: StatA = useMemo(() => ({
    trainings: seasonStats.trainings, tournaments: seasonStats.tournaments,
    wins: reflect.M.wins, losses: reflect.M.losses, rest: seasonStats.rest,
    winPct: reflect.M.winPct, firstSetPct: reflect.M.firstSetPct,
    closePct: reflect.M.closePct, comebackPct: reflect.M.comebackPct, bestSurface: reflect.bestSurface,
  }), [seasonStats, reflect]);

  // měsíc (po–ne)
  const grid = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7;
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month]);

  // týden
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekRef); d.setDate(d.getDate() + i); return d; }), [weekRef]);

  // rok — měsíce v barvách
  const yearMonths = useMemo(() => {
    const months: Date[] = [];
    let cur = new Date(winRange.s.getFullYear(), winRange.s.getMonth(), 1);
    const last = new Date(winRange.e.getFullYear(), winRange.e.getMonth(), 1);
    while (cur <= last) { months.push(new Date(cur)); cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1); }
    return months;
  }, [winRange]);

  // zátěž — týdenní počet tréninkových jednotek
  const loadWeeks = useMemo(() => {
    const buckets: { ws: Date; tj: number; tourn: number }[] = [];
    const start = weekStart(winRange.s);
    for (const d = new Date(start); d <= winRange.e; d.setDate(d.getDate() + 7)) {
      const a = new Date(d), b = new Date(d); b.setDate(b.getDate() + 6); b.setHours(23, 59, 59);
      let tj = 0, tourn = 0;
      for (const e of events) { const x = new Date(e.date); if (x >= a && x <= b) { if (e.type === "training" || e.type === "conditioning") tj++; else if (e.type === "tournament") tourn++; } }
      buckets.push({ ws: new Date(a), tj, tourn });
    }
    return buckets;
  }, [events, winRange]);

  const nowPct = useMemo(() => {
    const a = winRange.s.getTime(), b = winRange.e.getTime(), n = Date.now();
    if (n < a || n > b) return null;
    return ((n - a) / (b - a)) * 100;
  }, [winRange]);

  /* ---------- gating ---------- */
  if (gate === "loading") return <div className="acct-loading">Načítám Moji cestu…</div>;

  const Shell = (inner: React.ReactNode) => (
    <div className="acct-page">
      <header className="subhdr"><div className="wrap"><div className="bar">
        <Link href="/" className="brand"><Wordmark /></Link>
        <Link href="/ucet" className="back">← Můj účet</Link>
      </div></div></header>
      <div className="wrap acct-wrap mc-wrap">{inner}</div>
    </div>
  );

  if (gate === "noauth") return Shell(
    <div className="acct-card mc-gate"><Route size={34} /><h1>Moje cesta</h1>
      <p>Sezónní průvodce pro tebe i tvé dítě. Přihlas se a začni plánovat.</p>
      <Link href="/prihlaseni?next=/moje-cesta" className="btn btn-green">Přihlásit se</Link></div>
  );
  if (gate === "nomember") return Shell(
    <div className="acct-card mc-gate"><Lock size={34} /><h1>Moje cesta je součást HUB+</h1>
      <p>Naplánuj celou sezónu — tréninky, turnaje, kondici i volno — a sleduj cíle a statistiky. Aktivuj HUB+ a máš to odemčené.</p>
      <Link href="/ucet" className="btn btn-gold">Chci HUB+</Link></div>
  );

  const VIEWS: [View, string, React.ReactNode][] = [
    ["month", "Měsíc", <CalendarDays key="m" size={15} />],
    ["week", "Týden", <CalendarRange key="w" size={15} />],
    ["year", "Rok", <Grid3x3 key="y" size={15} />],
    ["load", "Zátěž", <TrendingUp key="l" size={15} />],
    ["reflect", "Ohlédnutí", <History key="r" size={15} />],
  ];
  const maxTj = Math.max(3, ...loadWeeks.map((w) => w.tj));

  return Shell(<>
    <div className="mc-head">
      <h1 className="acct-h1"><Route size={26} style={{ verticalAlign: "-4px" }} /> Moje cesta</h1>
      <div className="mc-players">
        {players.map((p) => (
          <button key={p.id} className={`mc-ptab${p.id === pid ? " on" : ""}`} onClick={() => selectPlayer(p.id)}>
            {p.name} <span className="mc-lvl">{p.level === "competitive" ? (p.category || "závodní") : "hobby"}</span>
          </button>
        ))}
        <button className="mc-ptab mc-padd" onClick={openNewPlayer}><Plus size={15} /> Hráč</button>
        {players.length >= 2 && <button className="mc-ptab mc-pcompare" onClick={loadCompare}><Users size={15} /> Porovnat</button>}
      </div>
    </div>

    {!player ? (
      <div className="acct-card mc-gate"><Route size={30} /><h2>Založ si prvního hráče</h2>
        <p>Může to být tvé dítě (spravuješ ho ty) i ty sám. Klidně víc hráčů. Pak naplánuješ celou sezónu.</p>
        <button className="btn btn-green" onClick={openNewPlayer}><Plus size={16} /> Přidat hráče</button></div>
    ) : (<>
      {/* OSA SEZÓNY */}
      <div className="acct-card mc-season">
        <div className="acct-card-head"><CalendarDays size={20} />
          <h2>Sezóna — {player.name}
            {player.level === "competitive" && (
              <span className="mc-meta">{player.category ? ` · ${player.category}` : ""}{player.ranking != null ? ` · žebříček ${player.ranking}.` : ""}</span>
            )}
          </h2>
          <button className="linklike" style={{ marginLeft: "auto" }} onClick={() => editPlayer(player)}><Pencil size={15} /> Upravit hráče</button>
        </div>
        <div className="mc-axis">
          {segs.map((s, i) => {
            const total = segs[segs.length - 1].e.getTime() - segs[0].s.getTime();
            const w = ((s.e.getTime() - s.s.getTime()) / total) * 100;
            const here = Date.now() >= s.s.getTime() && Date.now() <= s.e.getTime();
            return <div key={i} className={`mc-seg${here ? " here" : ""}`} style={{ width: `${w}%`, background: s.color }}><span>{s.label}</span></div>;
          })}
          {nowPct != null && <div className="mc-now" style={{ left: `${nowPct}%` }} title="Jsi tady" />}
        </div>
      </div>

      {/* STATISTIKY — volitelné metriky */}
      <div className="mc-statbar">
        <div className="mc-stats">
          {METRIC_DEFS.filter((d) => statKeys.includes(d.key)).map((d) => (
            <div className="mc-stat" key={d.key}><b>{d.fmt(statA)}</b><span>{d.label}</span></div>
          ))}
          {statKeys.length === 0 && <p className="member-note" style={{ margin: "0.5rem 0" }}>Žádná metrika — vyber si vpravo, co chceš vidět.</p>}
        </div>
        <div className="mc-cfgwrap">
          <button className="mc-cfgbtn" onClick={() => setShowStatCfg((v) => !v)}><SlidersHorizontal size={15} /> Metriky</button>
          {showStatCfg && (
            <div className="mc-cfgmenu">
              <b>Co zobrazit</b>
              {METRIC_DEFS.map((d) => (
                <label key={d.key}><input type="checkbox" checked={statKeys.includes(d.key)} onChange={() => toggleStat(d.key)} /> {d.label}</label>
              ))}
              <button className="btn btn-out btn-sm" onClick={() => setShowStatCfg(false)}><Check size={13} /> Hotovo</button>
            </div>
          )}
        </div>
      </div>

      <div className="mc-cols">
        <div className="acct-card mc-cal">
          {/* přepínač náhledů */}
          <div className="mc-views">
            {VIEWS.map(([v, label, ic]) => (
              <button key={v} className={`mc-vbtn${view === v ? " on" : ""}`} onClick={() => setView(v)}>{ic} {label}</button>
            ))}
          </div>

          {/* MĚSÍC */}
          {view === "month" && (<>
            <div className="mc-calhead">
              <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Předchozí"><ChevronLeft size={18} /></button>
              <h2>{MONTHS[month.getMonth()]} {month.getFullYear()}</h2>
              <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Další"><ChevronRight size={18} /></button>
            </div>
            <div className="mc-grid mc-wdrow">{WD.map((w) => <span key={w} className="mc-wd">{w}</span>)}</div>
            <div className="mc-grid mc-grid-big">
              {grid.map((d, i) => {
                if (!d) return <span key={i} className="mc-cell empty" />;
                const k = iso(d); const evs = evByDay[k] ?? [];
                return (
                  <button key={i} className={`mc-cell${k === todayISO ? " today" : ""}`} onClick={() => setEvForm({ open: true, date: k, type: evTypes[0]?.key ?? "training" })}>
                    <span className="mc-daynum">{d.getDate()}</span>
                    <span className="mc-chips">
                      {evs.slice(0, 3).map((e) => (
                        <i key={e.id} className="mc-chip" style={{ background: typeOf(e.type).color }}
                          title={typeOf(e.type).label + (e.title ? ` — ${e.title}` : "")}
                          onClick={(ev) => { ev.stopPropagation(); setEvForm({ open: true, ...e }); }}>
                          {e.title || typeOf(e.type).label}
                        </i>
                      ))}
                      {evs.length > 3 && <i className="mc-chip more">+{evs.length - 3}</i>}
                    </span>
                  </button>
                );
              })}
            </div>
          </>)}

          {/* TÝDEN */}
          {view === "week" && (<>
            <div className="mc-calhead">
              <button onClick={() => { const d = new Date(weekRef); d.setDate(d.getDate() - 7); setWeekRef(d); }} aria-label="Předchozí"><ChevronLeft size={18} /></button>
              <h2>{weekDays[0].getDate()}.&nbsp;{MON3[weekDays[0].getMonth()]} – {weekDays[6].getDate()}.&nbsp;{MON3[weekDays[6].getMonth()]}</h2>
              <button onClick={() => { const d = new Date(weekRef); d.setDate(d.getDate() + 7); setWeekRef(d); }} aria-label="Další"><ChevronRight size={18} /></button>
            </div>
            <div className="mc-week">
              {weekDays.map((d, i) => {
                const k = iso(d); const evs = evByDay[k] ?? [];
                return (
                  <div key={i} className={`mc-wday${k === todayISO ? " today" : ""}`}>
                    <div className="mc-wday-h"><b>{WD[i]}</b> {d.getDate()}.{d.getMonth() + 1}.</div>
                    <div className="mc-wday-evs">
                      {evs.map((e) => (
                        <button key={e.id} className="mc-wev" style={{ borderLeftColor: typeOf(e.type).color }} onClick={() => setEvForm({ open: true, ...e })}>
                          <b>{e.title || typeOf(e.type).label}</b>
                          <span>{typeOf(e.type).label}{e.location ? ` · ${e.location}` : ""}{e.type === "tournament" && e.win != null ? ` · ${e.win ? "✓ výhra" : "prohra"}` : ""}</span>
                        </button>
                      ))}
                      <button className="mc-wadd" onClick={() => setEvForm({ open: true, date: k, type: evTypes[0]?.key ?? "training" })}><Plus size={13} /> přidat</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>)}

          {/* ROK — měsíce v barvách */}
          {view === "year" && (<>
            <div className="mc-calhead"><h2>Sezóna v barvách — čemu ses kdy věnoval</h2></div>
            <div className="mc-year">
              {yearMonths.map((m, mi) => {
                const dim = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
                return (
                  <div className="mc-yrow" key={mi}>
                    <span className="mc-ylabel">{MON3[m.getMonth()]} ’{String(m.getFullYear()).slice(2)}</span>
                    <div className="mc-ydays">
                      {Array.from({ length: dim }, (_, di) => {
                        const d = new Date(m.getFullYear(), m.getMonth(), di + 1); const k = iso(d); const evs = evByDay[k] ?? [];
                        const c = evs.length ? typeOf(evs[0].type).color : undefined;
                        return <button key={di} className={`mc-yday${k === todayISO ? " today" : ""}`} style={{ background: c ?? "#edeff1" }}
                          title={`${d.getDate()}.${d.getMonth() + 1}.${evs.length ? " — " + evs.map((e) => typeOf(e.type).label).join(", ") : ""}`}
                          onClick={() => setEvForm({ open: true, ...(evs[0] ?? { date: k, type: evTypes[0]?.key ?? "training" }) })} />;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mc-legend">{evTypes.map((t) => <span key={t.key}><i style={{ background: t.color }} />{t.label}</span>)}</div>
          </>)}

          {/* ZÁTĚŽ — křivka četnosti TJ */}
          {view === "load" && (<>
            <div className="mc-calhead"><h2>Zátěž — tréninkové jednotky po týdnech</h2></div>
            <div className="mc-loadchart">
              <svg viewBox={`0 0 ${Math.max(60, loadWeeks.length * 16)} 130`} preserveAspectRatio="none" className="mc-loadsvg">
                {[0.25, 0.5, 0.75, 1].map((g, i) => <line key={i} x1="0" x2={loadWeeks.length * 16} y1={105 - g * 95} y2={105 - g * 95} stroke="#e6e8ea" strokeWidth="1" />)}
                {loadWeeks.map((w, i) => {
                  const h = (w.tj / maxTj) * 95;
                  return <g key={i}>
                    <rect x={i * 16 + 3} y={105 - h} width={10} height={h} rx={2} fill="var(--green)" />
                    {w.tourn > 0 && <circle cx={i * 16 + 8} cy={105 - h - 7} r={3.5} fill="var(--gold)" />}
                  </g>;
                })}
                {loadWeeks.map((w, i) => w.ws.getDate() <= 7
                  ? <text key={`t${i}`} x={i * 16 + 8} y={122} fontSize="8" textAnchor="middle" fill="#9aa3ad">{MON3[w.ws.getMonth()]}</text>
                  : null)}
              </svg>
              <div className="mc-loadleg"><span><i style={{ background: "var(--green)" }} /> tréninková jednotka (počet/týden)</span><span><i className="dot" style={{ background: "var(--gold)" }} /> týden s turnajem</span></div>
              <p className="member-note">Křivka ukazuje periodicitu zátěže — v přípravě roste objem, v sezóně se ladí, v mezisezóně klesá (regenerace).</p>
            </div>
          </>)}

          {/* OHLÉDNUTÍ — analýza zápasů */}
          {view === "reflect" && (<>
            <div className="mc-calhead"><h2>Ohlédnutí — jak ti to jde</h2></div>
            <div className="mc-rmetrics">
              <div className="mc-rm"><b>{reflect.M.winPct != null ? `${reflect.M.winPct} %` : "—"}</b><span>úspěšnost ({reflect.M.wins}–{reflect.M.losses})</span></div>
              <div className="mc-rm"><b>{reflect.M.firstSetPct != null ? `${reflect.M.firstSetPct} %` : "—"}</b><span>vyhraný 1. set</span></div>
              <div className="mc-rm"><b>{reflect.M.closePct != null ? `${reflect.M.closePct} %` : "—"}</b><span>dotažení (vedu 1. set → výhra)</span></div>
              <div className="mc-rm"><b>{reflect.M.comebackPct != null ? `${reflect.M.comebackPct} %` : "—"}</b><span>otočky (prohra 1. setu → výhra)</span></div>
            </div>

            <h3 className="mc-adm-h">Úspěšnost po měsících</h3>
            <div className="mc-months">
              {reflect.monthly.map((m, i) => {
                const p = m.t ? Math.round(m.w / m.t * 100) : 0;
                const best = reflect.best?.idx === i && m.t > 0;
                return (
                  <div className="mc-mcol" key={i} title={m.t ? `${m.w}/${m.t} výher` : "bez zápasů"}>
                    <div className="mc-mbar"><div className={best ? "best" : ""} style={{ height: `${m.t ? Math.max(4, p) : 0}%` }} /></div>
                    <span className="mc-mpct">{m.t ? `${p}%` : "·"}</span>
                    <span className="mc-mlabel">{MON3[i]}</span>
                  </div>
                );
              })}
            </div>

            {reflect.surfRows.length > 0 && (<>
              <h3 className="mc-adm-h">Úspěšnost podle povrchu</h3>
              <div className="mc-surf">
                {reflect.surfRows.map((s) => (
                  <div className="mc-surfrow" key={s.k}>
                    <span className="mc-surfname">{s.label}</span>
                    <div className="mc-prog"><div style={{ width: `${s.p}%` }} /></div>
                    <span className="mc-surfval">{s.p} % <em>({s.w}/{s.t})</em></span>
                  </div>
                ))}
              </div>
            </>)}

            {reflect.tips.length > 0 && (
              <div className="mc-insights">
                {reflect.tips.map((t, i) => <p key={i}><Lightbulb size={15} /> {t}</p>)}
              </div>
            )}
            <p className="member-note">Tip: u turnajů vyplňuj <b>skóre po setech</b> (6:4, 3:6…) — z toho se počítá dotahování zápasů, otočky i třísetové bilance.</p>
          </>)}
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
                  <div className="mc-goaltop"><b>{g.title}</b><button className="linklike danger" onClick={() => delGoal(g.id)}><Trash2 size={14} /></button></div>
                  {g.target && <span className="mc-goaltarget">{g.target}</span>}
                  <div className="mc-prog"><div style={{ width: `${g.progress}%` }} /></div>
                  <div className="mc-progbtns">{[0, 25, 50, 75, 100].map((v) => <button key={v} className={g.progress === v ? "on" : ""} onClick={() => setGoalProgress(g, v)}>{v}%</button>)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>)}

    {/* MODÁL: hráč */}
    {pForm.open && (
      <div className="mc-modal" onClick={() => setPForm(PCLOSED)}>
        <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
          <button className="mc-x" onClick={() => setPForm(PCLOSED)}><X size={18} /></button>
          <h3>{pForm.id ? "Upravit hráče" : "Nový hráč"}</h3>
          <label>Jméno<input value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} placeholder="Např. Klárka / Já" /></label>
          <label>Úroveň
            <select value={pForm.level} onChange={(e) => setPForm({ ...pForm, level: e.target.value as "hobby" | "competitive" })}>
              <option value="hobby">Hobby</option><option value="competitive">Závodní</option>
            </select>
          </label>
          {pForm.level === "competitive" && (<>
            <div className="mc-sync">
              <span className="mc-setlbl">Napojení na žebříček (cesky-tenis.cz)</span>
              <div className="mc-syncrow">
                <input value={syncInput} onChange={(e) => setSyncInput(e.target.value)} placeholder="Vlož odkaz na svůj profil nebo číslo hráče (např. 1071630)" />
                <button type="button" className="btn btn-green" disabled={syncing} onClick={syncCT}><RefreshCw size={14} /> {syncing ? "Načítám…" : "Načíst"}</button>
              </div>
              {syncMsg && <p className="mc-syncmsg">{syncMsg}</p>}
              <p className="member-note" style={{ margin: "2px 0 0" }}>Na <b>cesky-tenis.cz</b> najdi svůj profil → zkopíruj odkaz z prohlížeče sem. Doplní jméno, ročník a aktuální místo v žebříčku.</p>
            </div>
            <label>Soutěž / třída<input value={pForm.category} onChange={(e) => setPForm({ ...pForm, category: e.target.value })} placeholder="Např. 4. třída D, mladší žactvo" /></label>
            <div className="mc-row2">
              <label>Místo v žebříčku<input value={pForm.ranking} onChange={(e) => setPForm({ ...pForm, ranking: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="152" /></label>
              <label>Číslo hráče (ČT)<input value={pForm.cts} onChange={(e) => setPForm({ ...pForm, cts: e.target.value })} placeholder="1071630" /></label>
            </div>
          </>)}
          <label>Rok narození (nepovinné)<input value={pForm.year} onChange={(e) => setPForm({ ...pForm, year: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="2014" /></label>
          <div className="mc-modal-actions">
            {pForm.id && <button className="btn btn-out danger" onClick={() => deletePlayer(players.find((x) => x.id === pForm.id)!)}><Trash2 size={14} /> Smazat hráče</button>}
            <button className="btn btn-green" disabled={busy} onClick={savePlayer}>{pForm.id ? "Uložit" : "Přidat hráče"}</button>
          </div>
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
          <label>Povrch
            <select value={evForm.surface ?? ""} onChange={(e) => setEvForm({ ...evForm, surface: e.target.value })}>
              {SURFACES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          {evForm.type === "tournament" && (<>
            <label>Soupeř<input value={evForm.opponent ?? ""} onChange={(e) => setEvForm({ ...evForm, opponent: e.target.value })} /></label>
            <span className="mc-setlbl">Skóre po setech (moje : soupeř)</span>
            <div className="mc-sets">
              {[0, 1, 2].map((i) => (
                <div className="mc-setrow" key={i}>
                  <span>{i + 1}. set</span>
                  <input inputMode="numeric" value={evForm.sets?.[i]?.me ? String(evForm.sets[i].me) : ""} onChange={(e) => setSet(i, "me", e.target.value)} placeholder="6" />
                  <em>:</em>
                  <input inputMode="numeric" value={evForm.sets?.[i]?.opp ? String(evForm.sets[i].opp) : ""} onChange={(e) => setSet(i, "opp", e.target.value)} placeholder="4" />
                </div>
              ))}
            </div>
            <label>Výsledek (vyplní se ze setů, můžeš přepsat)
              <select value={evForm.win === true ? "w" : evForm.win === false ? "l" : ""} onChange={(e) => setEvForm({ ...evForm, win: e.target.value === "w" ? true : e.target.value === "l" ? false : null })}>
                <option value="">— automaticky —</option><option value="w">Výhra</option><option value="l">Prohra</option>
              </select>
            </label>
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

    {/* MODÁL: porovnání hráčů */}
    {compareOpen && (
      <div className="mc-modal" onClick={() => setCompareOpen(false)}>
        <div className="mc-modal-in mc-modal-wide" onClick={(e) => e.stopPropagation()}>
          <button className="mc-x" onClick={() => setCompareOpen(false)}><X size={18} /></button>
          <h3><Users size={18} style={{ verticalAlign: "-3px" }} /> Porovnání hráčů</h3>
          {(() => {
            const rows = players.map((p) => ({ p, m: computeMetrics(allEv.filter((e) => e.player_id === p.id)) }));
            const num = (v: number | null) => v != null ? `${v} %` : "—";
            const bestBy = (sel: (m: Metrics) => number | null, min = 1, key: (m: Metrics) => number = sel as (m: Metrics) => number) => {
              const c = rows.filter((r) => sel(r.m) != null && key(r.m) >= min);
              return c.length ? c.reduce((a, b) => (sel(b.m)! > sel(a.m)!) ? b : a) : null;
            };
            const bw = bestBy((m) => m.winPct, 2, (m) => m.played);
            const bc = bestBy((m) => m.closePct, 2, (m) => m.played);
            const bt = rows.reduce((a, b) => b.m.trainings > a.m.trainings ? b : a, rows[0]);
            const tips: string[] = [];
            if (bw) tips.push(`Nejvyšší úspěšnost: ${bw.p.name} (${bw.m.winPct} %).`);
            if (bc) tips.push(`Nejlíp dotahuje vedené zápasy: ${bc.p.name} (${bc.m.closePct} %).`);
            if (bt && bt.m.trainings > 0) tips.push(`Nejvíc trénuje: ${bt.p.name} (${bt.m.trainings} jednotek).`);
            return (<>
              <div className="admin-scroll">
                <table className="admin-table mc-ctable">
                  <thead><tr><th>Hráč</th><th>TJ</th><th>Turnaje</th><th>Bilance</th><th>Úsp.</th><th>1. set</th><th>Dotažení</th><th>Otočky</th></tr></thead>
                  <tbody>
                    {rows.map(({ p, m }) => (
                      <tr key={p.id} className={p.id === pid ? "mc-crow-on" : ""}>
                        <td><b>{p.name}</b> <span className="mc-lvl">{p.level === "competitive" ? (p.category || "záv.") : "hobby"}</span></td>
                        <td>{m.trainings}</td><td>{m.tournaments}</td>
                        <td>{m.wins}–{m.losses}</td>
                        <td>{num(m.winPct)}</td><td>{num(m.firstSetPct)}</td><td>{num(m.closePct)}</td><td>{num(m.comebackPct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {tips.length > 0 && <div className="mc-insights">{tips.map((t, i) => <p key={i}><Lightbulb size={15} /> {t}</p>)}</div>}
              <p className="member-note">Procenta dávají smysl od pár odehraných zápasů. Vyplňuj u turnajů sety, ať je porovnání přesné.</p>
            </>);
          })()}
        </div>
      </div>
    )}
  </>);
}
