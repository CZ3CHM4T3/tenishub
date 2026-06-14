"use client";

import { useState } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

const COURTS = ["Kurt 1", "Kurt 2", "Kurt 3", "Kurt 4 · krytý"];
const HOURS = Array.from({ length: 14 }, (_, i) => 8 + i); // 8:00–21:00
// 0 volno, 1 rezervováno, 2 trénink/škola, 3 údržba
const PLAN = [
  [2, 2, 0, 1, 1, 0, 2, 2, 0, 1, 1, 0, 1, 0],
  [1, 0, 1, 1, 0, 2, 2, 0, 1, 1, 0, 1, 1, 0],
  [0, 1, 1, 2, 2, 0, 1, 0, 1, 1, 1, 0, 1, 3],
  [3, 3, 2, 2, 1, 1, 0, 1, 1, 0, 2, 2, 1, 1],
];
const CLS = ["free", "book", "train", "block"];

const OFFERS = [
  { disc: "−30 %", t: "Kurt 2 · dnes 15:00", d: "90 min volných · 210 Kč místo 300" },
  { disc: "−30 %", t: "Kurt 3 · dnes 16:30", d: "60 min volných · 140 Kč místo 200" },
  { disc: "−25 %", t: "Kurt 1 · dnes 20:00", d: "60 min volných · 150 Kč místo 200" },
];

export default function ArealDashboard() {
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [offered, setOffered] = useState<Set<number>>(new Set());

  const toggleCell = (ci: number, hi: number) => {
    if (PLAN[ci][hi] !== 0) return;
    const key = `${ci}-${hi}`;
    setMine((m) => {
      const next = new Set(m);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="areal-page">
      <header className="subhdr">
        <div className="wrap">
          <div className="bar">
            <Link href="/" className="brand"><Wordmark /></Link>
            <div className="who"><span>Dashboard areálu</span><span className="av">SD</span> TK Sokol Dobřichovice</div>
          </div>
        </div>
      </header>

      <div className="wrap">
        <div className="head">
          <h1>Přehled areálu</h1>
          <div className="sub">Čtvrtek 11. 6. 2026 · 4 kurty · správa obsazenosti a rezervací</div>
        </div>

        <div className="stats">
          <div className="stat acc"><div className="n">68<span className="u">%</span></div><div className="l">obsazenost dnes</div></div>
          <div className="stat"><div className="n">24</div><div className="l">rezervací dnes</div></div>
          <div className="stat"><div className="n">3</div><div className="l">volné kurty teď</div></div>
          <div className="stat"><div className="n">8 400 <span className="u">Kč</span></div><div className="l">tržby dnes (online)</div></div>
        </div>

        <div className="fill">
          <h2>⚡ Obsaď volný kurt teď</h2>
          <div className="h2s">Prázdná okna v nejbližších hodinách — nabídni je se slevou a vyplň kapacitu.</div>
          <div className="offers">
            {OFFERS.map((o, i) => (
              <div className="offer" key={i}>
                <span className="disc">{o.disc}</span>
                <div className="t">{o.t}</div>
                <div className="d">{o.d}</div>
                <button
                  className="btn btn-gold"
                  disabled={offered.has(i)}
                  style={offered.has(i) ? { opacity: 0.7 } : undefined}
                  onClick={() => setOffered((s) => new Set(s).add(i))}
                >
                  {offered.has(i) ? "✓ Nabídnuto" : "Nabídnout se slevou"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="gtop">
            <h2>Rezervace kurtů — dnes</h2>
            <div className="legend">
              <span><i style={{ background: "#fff", border: "1px solid var(--line)" }} />volné</span>
              <span><i style={{ background: "var(--book)" }} />rezervováno</span>
              <span><i style={{ background: "var(--train)" }} />trénink/škola</span>
              <span><i style={{ background: "var(--block)" }} />údržba</span>
            </div>
          </div>
          <div className="gridscroll">
            <div className="court-grid">
              <div className="grow ghead">
                <div className="gc" />
                {HOURS.map((h) => <div className="gc" key={h}>{h}:00</div>)}
              </div>
              {COURTS.map((c, ci) => (
                <div className="grow" key={ci}>
                  <div className="court">{c}</div>
                  {HOURS.map((h, hi) => {
                    const key = `${ci}-${hi}`;
                    const isMine = mine.has(key);
                    const s = PLAN[ci][hi];
                    const cls = isMine ? "mine" : CLS[s];
                    const txt = isMine ? "✓ Vy" : s === 1 ? "•" : s === 2 ? "škola" : s === 3 ? "údržba" : "volno";
                    return (
                      <div className={`cell ${cls}`} key={hi} onClick={() => toggleCell(ci, hi)}>
                        {txt}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="note">Klikni na volné okno → rezervace + platba kartou (GoPay). Prázdné kurty nabídni přes „Obsaď kurt teď".</div>
        </div>
      </div>

      <footer>TenisHub.cz · model dashboardu areálu</footer>
    </div>
  );
}
