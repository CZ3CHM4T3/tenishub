"use client";

// Živé počítadlo zápasu pro rodiče u kurtu (Moje cesta). Boduje po fiftýnech, taguje
// jak bod padl (eso/dvojchyba/vítězný míč), ukládá živý stav do cesta_zapasy.state (obnova),
// po dohrání spočte statistiky. Engine: src/lib/tenisScore.ts (port z MS GEM).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  newMatch, award, serveFault, undo, situace, ptsLabel, curServ, computeStats, setsWon,
  scoreText, SIT_LABEL, type Match, type Cfg,
} from "@/lib/tenisScore";
import { Plus, X, Undo2, Play, Trophy, Flag, Trash2, ChevronRight, Activity } from "lucide-react";

type Row = {
  id: string; opponent: string | null; datum: string; surface: string | null;
  cfg: Cfg; state: { match?: Match }; status: "probiha" | "hotovo";
  score: string | null; win: boolean | null; sets: [number, number][] | null; stats: { a: ReturnType<typeof computeStats>["a"]; b: ReturnType<typeof computeStats>["b"] } | null;
};

const SURFACES: [string, string][] = [["antuka", "Antuka"], ["hard", "Hard"], ["hala", "Hala"], ["koberec", "Koberec"], ["trava", "Tráva"]];
const fmtD = (iso: string) => new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" });

export default function ZapasTracker({ playerId, playerName }: { playerId: string; playerName: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ opponent: "", surface: "antuka", gamesTo: 6, bestOf: 3, noAd: false, superTB: true, server: "a" as "a" | "b" });
  const [live, setLive] = useState<{ id: string; match: Match; cfg: Cfg } | null>(null);
  const [, force] = useState(0);
  const saveT = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("cesta_zapasy").select("id,opponent,datum,surface,cfg,state,status,score,win,sets,stats").eq("player_id", playerId).order("datum", { ascending: false }).order("updated_at", { ascending: false });
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }, [supabase, playerId]);
  useEffect(() => { load(); }, [load]);

  const saveState = useCallback((id: string, match: Match) => {
    if (saveT.current) clearTimeout(saveT.current);
    saveT.current = setTimeout(() => { supabase.from("cesta_zapasy").update({ state: { match } }).eq("id", id); }, 700);
  }, [supabase]);

  const finalize = useCallback(async (id: string, match: Match, cfg: Cfg) => {
    const st = computeStats(match);
    const [sa, sb] = setsWon(match);
    await supabase.from("cesta_zapasy").update({
      status: "hotovo", state: { match }, score: scoreText(match), win: match.winner === "a",
      sets: match.sets, stats: st,
    }).eq("id", id);
    setLive(null); load();
  }, [supabase, load]);

  const startMatch = async () => {
    const cfg: Cfg = { gamesTo: Number(form.gamesTo), bestOf: Number(form.bestOf), noAd: form.noAd, superTB: form.superTB, startAt: 0 };
    const match = newMatch(playerName, form.opponent.trim() || "Soupeř", form.server);
    const { data, error } = await supabase.from("cesta_zapasy").insert({
      player_id: playerId, opponent: form.opponent.trim() || null, surface: form.surface, cfg, state: { match }, status: "probiha",
    }).select("id").single();
    if (error) { alert("Nepodařilo se založit zápas: " + error.message); return; }
    setShowForm(false);
    setLive({ id: (data as { id: string }).id, match, cfg });
  };

  const resume = (r: Row) => { const m = r.state?.match; if (m) setLive({ id: r.id, match: m, cfg: r.cfg }); };
  const del = async (id: string) => { if (!confirm("Smazat zápas?")) return; await supabase.from("cesta_zapasy").delete().eq("id", id); if (live?.id === id) setLive(null); load(); };

  const doPoint = (side: "a" | "b", ev?: string) => {
    if (!live) return; award(live.match, live.cfg, side, ev); force((x) => x + 1);
    if (live.match.winner) finalize(live.id, live.match, live.cfg); else saveState(live.id, live.match);
  };
  const doFault = () => { if (!live) return; serveFault(live.match, live.cfg); force((x) => x + 1); if (live.match.winner) finalize(live.id, live.match, live.cfg); else saveState(live.id, live.match); };
  const doUndo = () => { if (!live) return; undo(live.match); force((x) => x + 1); saveState(live.id, live.match); };

  // ── ŽIVÉ POČÍTADLO ──
  if (live) {
    const m = live.match, cfg = live.cfg;
    const [pa, pb] = ptsLabel(m);
    const [sa, sb] = setsWon(m);
    const srv = curServ(m, false);
    const sit = situace(m, cfg);
    const oppName = m.b || "Soupeř";
    return (
      <div className="zt">
        <div className="zt-top">
          <button className="linklike" onClick={() => { saveState(live.id, m); setLive(null); load(); }}>← Uložit a zavřít</button>
          <span className="zt-fmt">do {cfg.gamesTo} gemů · {cfg.bestOf === 1 ? "1 set" : cfg.bestOf === 3 ? "2 vítězné sety" : `${Math.ceil(cfg.bestOf / 2)} sety`}{cfg.noAd ? " · no-ad" : ""}</span>
        </div>

        {sit && <div className={`zt-sit zt-sit-${sit.side}`}>{SIT_LABEL[sit.kind]} {sit.side === "a" ? m.a : oppName}</div>}

        <div className="zt-scoreboard">
          <div className={`zt-pl${srv === "a" ? " serve" : ""}`}>
            <span className="zt-plname">{m.a}{srv === "a" && <span className="zt-ball" title={`${m.srv}. servis`}>{m.srv === 2 ? "②" : "①"}</span>}</span>
            <span className="zt-sets">{m.sets.map((s, i) => <b key={i}>{s[0]}</b>)}{sa >= 0 && <b className="zt-cur">{m.tb ? m.tbA : m.gA}</b>}</span>
            <span className="zt-pts">{m.tb ? m.tbA : pa}</span>
          </div>
          <div className={`zt-pl${srv === "b" ? " serve" : ""}`}>
            <span className="zt-plname">{oppName}{srv === "b" && <span className="zt-ball">{m.srv === 2 ? "②" : "①"}</span>}</span>
            <span className="zt-sets">{m.sets.map((s, i) => <b key={i}>{s[1]}</b>)}<b className="zt-cur">{m.tb ? m.tbB : m.gB}</b></span>
            <span className="zt-pts">{m.tb ? m.tbB : pb}</span>
          </div>
        </div>

        {m.winner ? (
          <div className="zt-done"><Trophy size={22} /> {m.winner === "a" ? `Vyhrál ${m.a}!` : `Vyhrál ${oppName}`} — {scoreText(m)}</div>
        ) : (<>
          <div className="zt-btnrow">
            <div className="zt-side zt-side-a">
              <button className="zt-big zt-big-a" onClick={() => doPoint("a")}>Bod<br /><b>{m.a}</b></button>
              <div className="zt-tags">
                <button onClick={() => doPoint("a", "eso")} disabled={srv !== "a"}>eso</button>
                <button onClick={() => doPoint("a", "win")}>vítězný míč</button>
              </div>
            </div>
            <div className="zt-side zt-side-b">
              <button className="zt-big zt-big-b" onClick={() => doPoint("b")}>Bod<br /><b>{oppName}</b></button>
              <div className="zt-tags">
                <button onClick={() => doPoint("b", "eso")} disabled={srv !== "b"}>eso</button>
                <button onClick={() => doPoint("b", "win")}>vítězný míč</button>
              </div>
            </div>
          </div>
          <div className="zt-ctrl">
            <button className="btn btn-out" onClick={doFault} disabled={m.tb}><Flag size={15} /> Chyba servisu {m.srv === 2 ? "(→ dvojchyba)" : "(1. → 2.)"}</button>
            <button className="btn btn-out" onClick={doUndo}><Undo2 size={15} /> Zpět</button>
          </div>
        </>)}
      </div>
    );
  }

  // ── SEZNAM ZÁPASŮ ──
  const probiha = rows.filter((r) => r.status === "probiha");
  const hotovo = rows.filter((r) => r.status === "hotovo");
  return (
    <div className="zt-list">
      <div className="zt-listhead">
        <p className="member-note" style={{ margin: 0 }}>Bodujte zápas svého hráče přímo u kurtu — po fiftýnech, s tagem jak bod padl. Z toho vzniknou statistiky.</p>
        <button className="btn btn-green" onClick={() => setShowForm(true)}><Plus size={16} /> Nový zápas</button>
      </div>

      {loading ? <p className="member-note">Načítám…</p> : (<>
        {probiha.length > 0 && (
          <div className="zt-group">
            <div className="zt-grouph"><Activity size={15} /> Rozehrané</div>
            {probiha.map((r) => (
              <div className="zt-row zt-row-live" key={r.id}>
                <span className="zt-row-ic"><Play size={16} /></span>
                <div className="zt-row-tx"><b>vs {r.opponent || "Soupeř"}</b><span>{fmtD(r.datum)}{r.surface ? ` · ${SURFACES.find((s) => s[0] === r.surface)?.[1] ?? r.surface}` : ""} · pokračovat</span></div>
                <button className="btn btn-green" style={{ padding: ".4rem .8rem", fontSize: ".85rem" }} onClick={() => resume(r)}>Pokračovat <ChevronRight size={14} /></button>
                <button className="zt-del" onClick={() => del(r.id)} aria-label="Smazat"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}

        {hotovo.length === 0 && probiha.length === 0 ? (
          <div className="acct-card mc-gate" style={{ margin: ".6rem 0 0" }}><Trophy size={28} /><h3>Zatím žádný zápas</h3><p>Založ první a boduj ho živě u kurtu.</p></div>
        ) : hotovo.map((r) => {
          const st = r.stats?.a; const oppSt = r.stats?.b;
          return (
            <div className={`zt-done-row${r.win ? " win" : " loss"}`} key={r.id}>
              <div className="zt-done-head">
                <span className="zt-res">{r.win ? "V" : "P"}</span>
                <div className="zt-done-tx"><b>vs {r.opponent || "Soupeř"}</b><span>{fmtD(r.datum)}{r.surface ? ` · ${SURFACES.find((s) => s[0] === r.surface)?.[1] ?? r.surface}` : ""}</span></div>
                <span className="zt-done-score">{r.score}</span>
                <button className="zt-del" onClick={() => del(r.id)} aria-label="Smazat"><Trash2 size={14} /></button>
              </div>
              {st && (
                <div className="zt-stats">
                  <span><b>{st.aces}</b> es</span>
                  <span><b>{st.df}</b> dvojchyb</span>
                  <span><b>{st.win}</b> vítěz. míčů</span>
                  <span><b>{st.bpWon}/{st.bp}</b> brejkbolů</span>
                  <span><b>{st.p1 ? Math.round((st.p1in / st.p1) * 100) : 0}%</b> 1. servis</span>
                  <span><b>{st.ptRun}</b> nejdelší šňůra</span>
                  {oppSt && <span className="zt-stat-opp">soupeř: {oppSt.aces} es · {oppSt.win} vít.</span>}
                </div>
              )}
            </div>
          );
        })}
      </>)}

      {showForm && (
        <div className="mc-modal" onClick={() => setShowForm(false)}>
          <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
            <button className="mc-x" onClick={() => setShowForm(false)}><X size={18} /></button>
            <h3>Nový zápas</h3>
            <label>Soupeř<input value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} placeholder="Jméno soupeře" autoFocus /></label>
            <div className="mc-row2">
              <label>Povrch<select value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })}>{SURFACES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <label>Do kolika gemů<select value={form.gamesTo} onChange={(e) => setForm({ ...form, gamesTo: Number(e.target.value) })}>{[4, 6].map((g) => <option key={g} value={g}>{g}</option>)}</select></label>
            </div>
            <div className="mc-row2">
              <label>Počet setů<select value={form.bestOf} onChange={(e) => setForm({ ...form, bestOf: Number(e.target.value) })}><option value={1}>1 set</option><option value={3}>2 vítězné (best of 3)</option><option value={5}>3 vítězné (best of 5)</option></select></label>
              <label>Rozhodující set<select value={form.superTB ? "1" : "0"} onChange={(e) => setForm({ ...form, superTB: e.target.value === "1" })}><option value="1">super-tiebreak (do 10)</option><option value="0">normální set</option></select></label>
            </div>
            <label className="clanek-samplechk"><input type="checkbox" checked={form.noAd} onChange={(e) => setForm({ ...form, noAd: e.target.checked })} /> No-ad (při shodě rozhoduje jeden míč)</label>
            <div className="fld"><label>Kdo podává první?</label>
              <div className="zt-serverpick">
                <button type="button" className={form.server === "a" ? "on" : ""} onClick={() => setForm({ ...form, server: "a" })}>{playerName}</button>
                <button type="button" className={form.server === "b" ? "on" : ""} onClick={() => setForm({ ...form, server: "b" })}>Soupeř</button>
              </div>
            </div>
            <button className="btn btn-green" onClick={startMatch}><Play size={16} /> Začít bodovat</button>
          </div>
        </div>
      )}
    </div>
  );
}
