"use client";

import { useEffect, useMemo, useState, type MouseEvent as RMouseEvent } from "react";
import {
  IC,
  TIERS,
  NORANK,
  Chapter,
  Node,
  Curriculum,
  nodesOf,
  chapMaxXP,
  nodeState,
  childState,
  iconPathOf,
  xreqInfo,
  pileSrc,
  lvlThr,
  MAX_LEVEL,
  fmt,
} from "@/lib/kariera";

// XP liga: bez ligy (obrys) + 10 tierů; base = level, na kterém se erb získává
const RANKS = [
  { n: NORANK.n, e: NORANK.e, c: NORANK.c, base: 0 },
  ...TIERS.map((T, i) => ({ n: T.n, e: T.e, c: T.c, base: (i + 1) * 5 })),
];

function Coin({ cls = "xpc" }: { cls?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={cls} src="/xp-coin.png" alt="XP" />;
}
function Erb({ level, cls, noLvl }: { level: number; cls?: string; noLvl?: boolean }) {
  const ti = Math.floor(level / 5) - 1; // -1 = bez ligy (obrys)
  const norank = ti < 0;
  const t = norank ? null : TIERS[Math.min(9, ti)];
  return (
    <div className={"erb" + (norank ? " erb-norank" : "") + (cls ? " " + cls : "")}>
      {norank ? (
        <svg className="erb-out" viewBox="0 0 100 122" fill="none" aria-hidden="true">
          <path d="M50 13 L83 25 V59 C83 87 50 109 50 109 C50 109 17 87 17 59 V25 Z" />
        </svg>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/erb/${t!.e}.png`} alt={t!.n} />
      )}
      {!noLvl && <span className="erb-lvl">{level}</span>}
    </div>
  );
}

// osu 0–50 zarovnává tak, aby úroveň 5·i seděla pod středem erbu i (11 sloupců)
function axisX(L: number) {
  return ((L / 5 + 0.5) / 11) * 100;
}
// barvy 10 úseků mezi hlavními body: [0–5)=bez ligy, [5–10)=Dřevo … [45–50)=Mistr
const SEG_COLORS = [NORANK.c, ...TIERS.slice(0, 9).map((t) => t.c)];

const SEG_GRAD = `linear-gradient(90deg,${SEG_COLORS.map((c, k) => `${c} ${k * 10}% ${(k + 1) * 10}%`).join(",")})`;

function LevelAxis({ level, hover, setHover }: { level: number; hover: number | null; setHover: (n: number | null) => void }) {
  const dots: number[] = [];
  for (let L = 0; L <= 50; L++) dots.push(L);
  function onMove(e: RMouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const f = (e.clientX - r.left) / r.width;
    setHover(Math.max(0, Math.min(50, Math.round((f * 11 - 0.5) * 5))));
  }
  const fullSpan = axisX(50) - axisX(0);
  const barW = hover != null ? axisX(hover) - axisX(0) : 0;
  return (
    <div className="lvl-axis">
      <div className="la-track" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <div className="la-line" />
        {SEG_COLORS.map((c, k) => {
          const x1 = axisX(5 * k);
          const x2 = axisX(5 * (k + 1));
          return <span key={k} className={"la-seg" + (5 * (k + 1) <= level ? " on" : "")} style={{ left: x1 + "%", width: x2 - x1 + "%", ["--sc" as string]: c }} />;
        })}
        <div className="la-fill" style={{ width: axisX(level) - axisX(0) + "%" }} />
        {hover != null && barW > 0.1 && (
          <div
            className="la-hoverfill"
            style={{ left: axisX(0) + "%", width: barW + "%", backgroundImage: SEG_GRAD, backgroundSize: `${(fullSpan / barW) * 100}% 100%` }}
          />
        )}
        {dots.map((L) => {
          const big = L % 5 === 0;
          const col = RANKS[Math.floor(L / 5)].c;
          const hov = hover != null && L <= hover;
          return (
            <span
              key={L}
              className={"la-dot" + (big ? " big" : "") + (L <= level ? " on" : "") + (hov ? " hov" : "") + (hover === L ? " at" : "")}
              style={{ left: axisX(L) + "%", ["--dc" as string]: col }}
            />
          );
        })}
        <span className="la-cur" style={{ left: axisX(level) + "%" }} aria-hidden="true" />
        {hover != null && (
          <span className="la-hint" style={{ left: axisX(hover) + "%" }}>
            <b>{hover}</b> {hover === 0 ? "bez ligy" : `lvl · ${RANKS[Math.floor(hover / 5)].n}`}
          </span>
        )}
      </div>
      <div className="la-labels">
        {RANKS.map((T, i) => (
          <span key={T.e} className={"la-lb" + (i === Math.floor(level / 5) ? " cur" : "") + (hover != null && i === Math.floor(hover / 5) ? " hov" : "")} style={{ left: axisX(i * 5) + "%" }}>
            {i * 5}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Kariera({ unlocked, cur }: { unlocked: string[]; cur: Curriculum }) {
  const [open, setOpen] = useState<Chapter | null>(null);
  const [hoverLvl, setHoverLvl] = useState<number | null>(null);
  const hoverTi = hoverLvl == null ? null : Math.floor(hoverLvl / 5); // 0=bez ligy … 10=Legenda (= index v RANKS)
  const unlockedSet = useMemo(() => new Set(unlocked), [unlocked]);
  const st = useMemo(() => childState(unlockedSet, cur), [unlockedSet, cur]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const level = st.level;
  const t = st.tier;
  const base = lvlThr(level, st.maxXp);
  const next = lvlThr(Math.min(level + 1, MAX_LEVEL), st.maxXp);
  const pctInLevel = level >= MAX_LEVEL ? 100 : Math.round(((st.totalXp - base) / (next - base || 1)) * 100);

  return (
    <div className="kar-wrap" style={{ ["--frame" as string]: t.c, ["--glow" as string]: Math.max(0, st.tierIndex) * 4 + "px" }}>
      <div className="ka-hero">
        <div className="ka-tier-col">
          <div className="ka-badge">
            <Erb level={level} />
          </div>
          <div className="ka-tiername">{t.n}</div>
        </div>
        <div className="ka-info">
          <div className="ka-barrow">
            <div className="ka-cur">
              <div className="ka-cur-lvl">Level {level}</div>
              <div className="ka-cur-tn">{t.n}</div>
            </div>
            <div className="ka-bar-mid">
              <div className="xp-bar big">
                <i style={{ width: pctInLevel + "%" }} />
                <span className="xp-bar-txt">
                  {level >= MAX_LEVEL ? "MAX LEVEL 50" : <><b>{fmt(next - st.totalXp)}</b> XP</>}
                </span>
              </div>
            </div>
            {level < MAX_LEVEL && (
              <div className="ka-next" title={`Další: ${TIERS[Math.min(9, Math.floor((level + 1) / 5))].n} · level ${level + 1}`}>
                <Erb level={level + 1} cls="ka-nexterb" />
                <span className="ka-next-l">Lvl {level + 1}</span>
              </div>
            )}
            <div className="ka-pile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pileSrc(st.globalPct)} alt="XP coiny" />
              <span className="ka-pile-n"><b>{fmt(st.totalXp)}</b> XP</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tier-ladder-wrap">
        <div className="tll-title">XP LIGY</div>
        <div className="tll-h">
          Cesta k levelu 50 · <span>max. dosažitelné XP roste s obsahem: <b>{fmt(st.maxXp)}</b> <Coin /></span>
        </div>
        <div className="tier-ladder">
          {RANKS.map((T, idx) => {
            // idx 0 = bez ligy (tierIndex -1), idx k = tierIndex k-1
            const cur = st.tierIndex + 1 === idx;
            return (
              <div className={"tier" + (cur ? " cur" : "") + (hoverTi === idx ? " hl" : "")} key={T.e} style={{ ["--tc" as string]: T.c }}>
                <div className="tb">
                  <Erb level={cur ? level : T.base} noLvl />
                </div>
                <div className="tn">{T.n}</div>
              </div>
            );
          })}
        </div>
        <LevelAxis level={level} hover={hoverLvl} setHover={setHoverLvl} />
      </div>

      <ChapterGroup title="Na kurtu" hint="klikni pro strom dovedností" icon="court" list={cur.chapters.filter((c) => c.g === "kurt")} st={st} cur={cur} onOpen={setOpen} />
      <ChapterGroup title="Mimo kurt" icon="stack" list={cur.chapters.filter((c) => c.g === "mimo")} st={st} cur={cur} onOpen={setOpen} />

      {open && <TechTree chap={open} unlocked={unlockedSet} cur={cur} onClose={() => setOpen(null)} />}
    </div>
  );
}

function ChapterGroup({
  title,
  hint,
  icon,
  list,
  st,
  cur,
  onOpen,
}: {
  title: string;
  hint?: string;
  icon: "court" | "stack";
  list: Chapter[];
  st: ReturnType<typeof childState>;
  cur: Curriculum;
  onOpen: (c: Chapter) => void;
}) {
  const iconPath =
    icon === "court"
      ? '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 12h18M8 4v6M16 4v6M8 14v6M16 14v6M12 10.5v3"/>'
      : '<path d="M12 2 2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>';
  return (
    <>
      <div className="ka-sys-h" style={title === "Mimo kurt" ? { marginTop: "1.7rem" } : undefined}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: iconPath }} />
        Kapitoly · {title}
        {hint && <span style={{ color: "#9fb4d1", fontWeight: 600, fontSize: ".85rem", marginLeft: ".4rem" }}>{hint}</span>}
      </div>
      <div className="chapters">
        {list.map((c) => {
          const pct = st.byChapter[c.k].pct;
          return (
            <button className="chap" key={c.k} style={{ ["--cc" as string]: c.c }} onClick={() => onOpen(c)}>
              <div className="cmax">
                <Coin />
                {fmt(chapMaxXP(c.k, cur))}
              </div>
              <div className="ci">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: IC[c.k] }} />
              </div>
              <div className="cn">{c.n}</div>
              <div className="cbar">
                <i style={{ width: pct + "%" }} />
              </div>
              <div className="cp">
                <span>{pct} %</span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function TechTree({ chap, unlocked, cur, onClose }: { chap: Chapter; unlocked: Set<string>; cur: Curriculum; onClose: () => void }) {
  const nodes = nodesOf(chap.k, cur);
  const maxCol = Math.max(...nodes.map((n) => n.col));
  const rowsUsed = [...new Set(nodes.map((n) => n.row))].sort((a, b) => a - b);
  const rowMap: Record<number, number> = {};
  rowsUsed.forEach((r, i) => (rowMap[r] = i));
  const maxRow = rowsUsed.length - 1;
  const CW = 190,
    CH = 150,
    PADX = 90,
    PADY = 70;
  const cw = maxCol * CW + PADX * 2,
    ch = maxRow * CH + PADY * 2;
  const pos: Record<string, { x: number; y: number }> = {};
  nodes.forEach((n) => (pos[n.id] = { x: PADX + n.col * CW, y: PADY + rowMap[n.row] * CH }));

  const stOf = (n: Node) => nodeState(chap.k, n, unlocked);
  const done = nodes.filter((n) => stOf(n) === "done");
  const totXp = done.reduce((s, n) => s + n.xp, 0);
  const pct = Math.round((done.length / nodes.length) * 100);

  return (
    <div className="tt-ov open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tt-head">
        <span className="tt-ic" style={{ background: chap.c }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: IC[chap.k] }} />
        </span>
        <div>
          <h2>{chap.n}</h2>
          <span className="tt-prog">Zvládnuto {pct} %</span>
        </div>
        <span className="tt-xp">
          <Coin />+{totXp} získáno
        </span>
        <button className="tt-close" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="tt-hint">Postupuješ zleva doprava — základy vlevo, mistrovské dovednosti vpravo. Každá dovednost dá XP podle obtížnosti.</div>
      <div className="tt-scroll">
        <div className="tt-canvas" style={{ width: cw, height: ch, ["--cc" as string]: chap.c }}>
          <svg className="tt-lines" width={cw} height={ch}>
            {nodes.flatMap((n) =>
              n.req.map((r) => {
                const a = pos[r],
                  b = pos[n.id];
                const on = stOf(n) !== "locked";
                return <line key={r + n.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={on ? chap.c : "#25395a"} strokeWidth={on ? 4 : 2.5} strokeLinecap="round" opacity={on ? 0.95 : 0.5} />;
              })
            )}
          </svg>
          {nodes.map((n) => {
            const s = stOf(n);
            const ic = s === "locked" ? '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>' : iconPathOf(n);
            return (
              <div className={"tt-node " + s} key={n.id} style={{ left: pos[n.id].x, top: pos[n.id].y, ["--cc" as string]: chap.c }} title={n.desc || undefined}>
                {s === "done" && (
                  <span className="nd-done">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                )}
                {n.desc && (
                  <span className="nd-info" title={n.desc}>i</span>
                )}
                <div className="nc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: ic }} />
                </div>
                <div className="nn">{n.n}</div>
                <div className="nx">
                  <Coin />
                  {n.xp}
                </div>
                {n.xreq && n.xreq.length > 0 && (
                  <div className="nd-req">
                    {n.xreq.map((xk) => {
                      const info = xreqInfo(cur, xk);
                      if (!info) return null;
                      const met = unlocked.has(xk);
                      return (
                        <span key={xk} className={"nd-reqchip" + (met ? " met" : "")} title={`Nejdřív: ${info.name} · ${info.chapName}${met ? " (splněno)" : ""}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: info.icon }} />
                          {info.name}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
