// Tenisový skórovací engine pro JEDEN zápas (port z MS GEM TurnajLive.tsx — jen herní logika,
// bez pavouků/skupin). Řeší body 0/15/30/40, shodu/výhodu, no-ad, gemy, sety, tiebreak,
// super-tiebreak, 1./2. servis, log bodů s tagem (eso/df/win/brejk) a statistiky.
// Čistá logika (bez Reactu/Supabase) — používá ji živé počítadlo v Moje cestě.

export type Side = "a" | "b"; // a = náš hráč, b = soupeř
export type Cfg = { gamesTo: number; bestOf: number; superTB: boolean; noAd: boolean; startAt: number; bodyTo?: number };
export type Ev = { side: Side; kind: string; set: number; gm?: number; sc?: string };
// záznam jednoho bodu pro statistiku: s=podávající, n=na kolikátém servisu bod padl (1/2), w=vítěz, k=druh, bp=byl to brejkbol
export type Pt = { s: Side; n: number; w: Side; k?: string; bp?: boolean };
export type Match = {
  a: string | null; b: string | null; started: boolean; server: Side | null;
  sets: [number, number][]; gA: number; gB: number; pA: number; pB: number;
  tb: boolean; tbA: number; tbB: number; tbFirst: Side | null; superDecider: boolean;
  winner: Side | null; events: Ev[]; mom: number[]; hist: string[];
  srv?: number; pts?: Pt[]; gw?: Side[];
};
export type PStat = { p1: number; p1in: number; p2: number; p2in: number; sp1won: number; sp1tot: number; sp2won: number; sp2tot: number; aces: number; df: number; win: number; bp: number; bpWon: number; pts: number; games: number; ptRun: number; gmRun: number };

export const DEFCFG: Cfg = { gamesTo: 6, bestOf: 3, superTB: true, noAd: false, startAt: 0 };
export const other = (s: Side): Side => (s === "a" ? "b" : "a");

export function newMatch(a: string | null, b: string | null, server: Side | null = "a"): Match {
  return { a, b, started: true, server, sets: [], gA: 0, gB: 0, pA: 0, pB: 0, tb: false, tbA: 0, tbB: 0, tbFirst: null, superDecider: false, winner: null, events: [], mom: [0], hist: [], srv: 1, pts: [], gw: [] };
}

const seq = ["0", "15", "30", "40"];
const pServer = (first: Side | null, n: number): Side | null => { if (!first) return null; if (n === 0) return first; return (Math.floor((n - 1) / 2) % 2 === 0) ? other(first) : first; };

export function ptsLabel(m: Match, bodyMode = false): [string, string] {
  if (bodyMode) return [String(m.pA), String(m.pB)];
  if (m.tb) return [String(m.tbA), String(m.tbB)];
  const a = m.pA, b = m.pB;
  if (a >= 3 && b >= 3) { if (a === b) return ["40", "40"]; return a > b ? ["VÝH", ""] : ["", "VÝH"]; }
  return [seq[Math.min(a, 3)], seq[Math.min(b, 3)]];
}
const tbServer = (m: Match): Side | null => pServer(m.tbFirst, m.tbA + m.tbB);
export const curServ = (m: Match, bodyMode: boolean): Side | null => (bodyMode ? m.server : (m.tb ? tbServer(m) : m.server));
export function setsWon(m: Match): [number, number] { let A = 0, B = 0; m.sets.forEach((s) => { if (s[0] > s[1]) A++; else B++; }); return [A, B]; }

export const SIT_LABEL: Record<string, string> = { gembol: "GEMBOL", brejkbol: "BREJKBOL", setbol: "SETBOL", mecbol: "MEČBOL" };
export function situace(m: Match, cfg: Cfg): { side: Side | null; kind: string } | null {
  if (m.winner || !m.started) return null;
  const need = Math.ceil(cfg.bestOf / 2);
  const [sa, sb] = setsWon(m);
  const check = (side: Side): string | null => {
    const setsW = side === "a" ? sa : sb;
    if (m.tb) {
      const tp = side === "a" ? m.tbA : m.tbB, op = side === "a" ? m.tbB : m.tbA, tgt = m.superDecider ? 10 : 7;
      if (tp + 1 >= tgt && (tp + 1) - op >= 2) return setsW === need - 1 ? "mecbol" : "setbol";
      return null;
    }
    if (cfg.bodyTo && cfg.bodyTo > 0) {
      const tp = side === "a" ? m.pA : m.pB, op = side === "a" ? m.pB : m.pA;
      if (tp + 1 >= cfg.bodyTo && (tp + 1) - op >= 2) return setsW === need - 1 ? "mecbol" : "setbol";
      return null;
    }
    const pp = side === "a" ? m.pA : m.pB, op = side === "a" ? m.pB : m.pA;
    const gamePoint = cfg.noAd ? pp >= 3 : (pp >= 3 && pp - op >= 1);
    if (!gamePoint) return null;
    const gS = side === "a" ? m.gA : m.gB, gO = side === "a" ? m.gB : m.gA;
    if (gS + 1 >= cfg.gamesTo && (gS + 1) - gO >= 2) return setsW === need - 1 ? "mecbol" : "setbol";
    return m.server === side ? "gembol" : "brejkbol";
  };
  const rank = (k: string | null) => (k === "mecbol" ? 4 : k === "setbol" ? 3 : k === "brejkbol" ? 2 : k === "gembol" ? 1 : 0);
  const ka = check("a"), kb = check("b");
  const ra = rank(ka), rb = rank(kb);
  if (ra === 0 && rb === 0) return null;
  return ra >= rb ? { side: "a", kind: ka as string } : { side: "b", kind: kb as string };
}

export function momOf(m: Match, cfg: Cfg): number {
  if (m.winner) return m.winner === "a" ? 100 : -100;
  const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));
  const [sa, sb] = setsWon(m);
  let cs = 0, pl = 0;
  if (cfg.bodyTo && cfg.bodyTo > 0) cs = clamp1((m.pA - m.pB) / cfg.bodyTo);
  else if (m.tb) cs = clamp1((m.tbA - m.tbB) / (m.superDecider ? 10 : 7));
  else { cs = clamp1((m.gA - m.gB) / Math.max(cfg.gamesTo, 1)); const pd = m.pA - m.pB; pl = clamp1(Math.sign(pd) * Math.min(1, Math.abs(pd) / 3)); }
  let d = (sa - sb) * 0.5 + cs * 0.34 + pl * 0.14;
  d = Math.max(-0.95, Math.min(0.95, d));
  return Math.round(d * 100);
}

function pushHist(m: Match) { m.hist.push(JSON.stringify({ sets: m.sets, gA: m.gA, gB: m.gB, pA: m.pA, pB: m.pB, tb: m.tb, tbA: m.tbA, tbB: m.tbB, tbFirst: m.tbFirst, server: m.server, superDecider: m.superDecider, winner: m.winner, ev: m.events.length, mom: m.mom.length, srv: m.srv ?? 1, pts: (m.pts?.length ?? 0), gw: (m.gw?.length ?? 0) })); if (m.hist.length > 80) m.hist.shift(); }
export function undo(m: Match) { const s = m.hist.pop(); if (!s) return; const p = JSON.parse(s); m.sets = p.sets; m.gA = p.gA; m.gB = p.gB; m.pA = p.pA; m.pB = p.pB; m.tb = p.tb; m.tbA = p.tbA; m.tbB = p.tbB; m.tbFirst = p.tbFirst; m.server = p.server; m.superDecider = p.superDecider; m.winner = p.winner; m.events.length = p.ev; m.mom.length = p.mom; m.srv = p.srv ?? 1; if (m.pts) m.pts.length = p.pts ?? 0; if (m.gw) m.gw.length = p.gw ?? 0; }

export function award(m: Match, cfg: Cfg, side: Side, ev?: string) {
  if (m.winner) return; pushHist(m);
  const need = Math.ceil(cfg.bestOf / 2);
  const evStart = m.events.length;
  const curGm = cfg.bodyTo ? 0 : m.gA + m.gB;
  const rec = () => {
    m.mom.push(momOf(m, cfg)); if (m.mom.length > 240) m.mom.shift();
    if (m.events.length > evStart) {
      const [pa, pb] = ptsLabel(m, !!cfg.bodyTo);
      const sc = m.winner ? "konec" : m.tb ? `tiebreak ${m.tbA}:${m.tbB}` : cfg.bodyTo ? `${pa}:${pb}` : `${m.gA}:${m.gB} gemy · ${pa}:${pb}`;
      for (let i = evStart; i < m.events.length; i++) { m.events[i].sc = sc; if (m.events[i].gm == null) m.events[i].gm = curGm; }
    }
  };
  if (ev) m.events.push({ side: ev === "df" || ev === "blunder" ? other(side) : side, kind: ev, set: m.sets.length, gm: curGm });

  if (!(cfg.bodyTo && cfg.bodyTo > 0) && !m.tb) {
    const srvSide: Side = ev === "df" ? other(side) : (m.server ?? "a");
    const ret = other(srvSide);
    const retP = ret === "a" ? m.pA : m.pB, srvP = srvSide === "a" ? m.pA : m.pB;
    const isBP = cfg.noAd ? retP >= 3 : (retP >= 3 && retP - srvP >= 1);
    (m.pts ||= []).push({ s: srvSide, n: ev === "df" ? 2 : (m.srv ?? 1), w: side, k: ev, bp: isBP });
    m.srv = 1;
  }

  if (cfg.bodyTo && cfg.bodyTo > 0) {
    if (side === "a") m.pA++; else m.pB++;
    m.server = other(side);
    if (Math.max(m.pA, m.pB) >= cfg.bodyTo && Math.abs(m.pA - m.pB) >= 2) {
      m.sets.push([m.pA, m.pB]); m.pA = 0; m.pB = 0;
      const s = setsWon(m); if (s[0] >= need) m.winner = "a"; else if (s[1] >= need) m.winner = "b";
    }
    if (m.winner) m.events.push({ side: m.winner, kind: "mecbol", set: Math.max(0, m.sets.length - 1) });
    rec(); return;
  }
  if (m.tb) {
    if (side === "a") m.tbA++; else m.tbB++;
    const tgt = m.superDecider ? 10 : 7;
    if ((m.tbA >= tgt || m.tbB >= tgt) && Math.abs(m.tbA - m.tbB) >= 2) {
      const w: Side = m.tbA > m.tbB ? "a" : "b";
      if (m.superDecider) { m.sets.push(w === "a" ? [1, 0] : [0, 1]); m.winner = w; }
      else {
        m.sets.push(w === "a" ? [cfg.gamesTo + 1, cfg.gamesTo] : [cfg.gamesTo, cfg.gamesTo + 1]); m.tb = false; m.gA = cfg.startAt; m.gB = cfg.startAt; m.pA = 0; m.pB = 0; m.server = m.tbFirst ? other(m.tbFirst) : "a";
        const s = setsWon(m); if (s[0] >= need) m.winner = "a"; else if (s[1] >= need) m.winner = "b"; else if (s[0] === need - 1 && s[1] === need - 1 && cfg.superTB) { m.tb = true; m.superDecider = true; m.tbA = 0; m.tbB = 0; m.tbFirst = m.server; }
      }
    }
    if (m.winner) m.events.push({ side: m.winner, kind: "mecbol", set: Math.max(0, m.sets.length - 1) });
    rec(); return;
  }
  if (side === "a") m.pA++; else m.pB++;
  const gw = cfg.noAd ? (m.pA >= 4 || m.pB >= 4) : ((m.pA >= 4 && m.pA - m.pB >= 2) || (m.pB >= 4 && m.pB - m.pA >= 2));
  if (gw) {
    const gwin: Side = m.pA > m.pB ? "a" : "b"; const wasBreak = !!m.server && gwin !== m.server; if (gwin === "a") m.gA++; else m.gB++; (m.gw ||= []).push(gwin); if (wasBreak) m.events.push({ side: m.server ?? gwin, kind: "brejk", set: m.sets.length }); m.pA = 0; m.pB = 0; m.server = m.server ? other(m.server) : "a";
    const top = Math.max(m.gA, m.gB), diff = Math.abs(m.gA - m.gB);
    if (m.gA === cfg.gamesTo && m.gB === cfg.gamesTo) { m.tb = true; m.tbA = 0; m.tbB = 0; m.tbFirst = m.server; m.superDecider = false; }
    else if (top >= cfg.gamesTo && diff >= 2) {
      m.sets.push([m.gA, m.gB]); m.gA = cfg.startAt; m.gB = cfg.startAt;
      const s = setsWon(m); if (s[0] >= need) m.winner = "a"; else if (s[1] >= need) m.winner = "b"; else if (s[0] === need - 1 && s[1] === need - 1 && cfg.superTB) { m.tb = true; m.superDecider = true; m.tbA = 0; m.tbB = 0; m.tbFirst = m.server; }
    }
  }
  if (m.winner) m.events.push({ side: m.winner, kind: "mecbol", set: Math.max(0, m.sets.length - 1) });
  rec();
}

export function serveFault(m: Match, cfg: Cfg) {
  if (m.winner || (cfg.bodyTo && cfg.bodyTo > 0) || m.tb) return;
  if ((m.srv ?? 1) === 1) { pushHist(m); m.srv = 2; }
  else award(m, cfg, other(m.server ?? "a"), "df");
}

export function computeStats(m: Match): { a: PStat; b: PStat } {
  const mk = (): PStat => ({ p1: 0, p1in: 0, p2: 0, p2in: 0, sp1won: 0, sp1tot: 0, sp2won: 0, sp2tot: 0, aces: 0, df: 0, win: 0, bp: 0, bpWon: 0, pts: 0, games: 0, ptRun: 0, gmRun: 0 });
  const A = mk(), B = mk();
  let lastW: Side | null = null, run = 0;
  (m.pts ?? []).forEach((pt) => {
    const W = pt.w === "a" ? A : B, S = pt.s === "a" ? A : B, R = pt.s === "a" ? B : A;
    W.pts++; S.p1++;
    if (pt.n === 1) { S.p1in++; S.sp1tot++; if (pt.w === pt.s) S.sp1won++; }
    else { S.p2++; S.sp2tot++; if (pt.k !== "df") S.p2in++; if (pt.w === pt.s) S.sp2won++; }
    if (pt.k === "eso") S.aces++;
    if (pt.k === "df") S.df++;
    if (pt.k === "win") W.win++;
    if (pt.bp) { R.bp++; if (pt.w !== pt.s) R.bpWon++; }
    if (pt.w === lastW) run++; else { lastW = pt.w; run = 1; }
    if (pt.w === "a") A.ptRun = Math.max(A.ptRun, run); else B.ptRun = Math.max(B.ptRun, run);
  });
  let ga = m.gA, gb = m.gB;
  (m.sets ?? []).forEach(([x, y]) => { ga += x; gb += y; });
  A.games = ga; B.games = gb;
  let lg: Side | null = null, gr = 0;
  (m.gw ?? []).forEach((g) => { if (g === lg) gr++; else { lg = g; gr = 1; } if (g === "a") A.gmRun = Math.max(A.gmRun, gr); else B.gmRun = Math.max(B.gmRun, gr); });
  return { a: A, b: B };
}

// textový výsledek "6:4, 3:6, 10:7" z dohraného zápasu
export function scoreText(m: Match): string { return m.sets.map(([a, b]) => `${a}:${b}`).join(", "); }
