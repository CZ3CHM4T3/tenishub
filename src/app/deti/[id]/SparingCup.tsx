"use client";

import { useState } from "react";
import { Trophy, Medal } from "lucide-react";
import { avatarSrc, fmtName } from "@/lib/avatar";

export type Standing = {
  dite_id: string;
  jmeno: string;
  prezdivka: string | null;
  avatar_model: string;
  anonym?: boolean;
  body: number;
  vyhry: number;
  prohry: number;
};
function jmenoV(p: { jmeno: string; prezdivka: string | null; anonym?: boolean }): string {
  return p.anonym ? "Anonym" : fmtName(p.jmeno, p.prezdivka);
}
export type Match = { id: string; souper: string; datum: string; gemy_pro: number; gemy_proti: number };

function dm(d: string) {
  const x = new Date(d);
  return isNaN(x.getTime()) ? d : `${x.getDate()}. ${x.getMonth() + 1}.`;
}
function Av({ model }: { model: string }) {
  return (
    <span className="cup-av">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={avatarSrc(model)} alt="" />
    </span>
  );
}

export default function SparingCup({
  myProgram,
  myId,
  proLadder,
  hobbyLadder,
  matches,
}: {
  myProgram: "pro" | "hobby";
  myId: string;
  proLadder: Standing[];
  hobbyLadder: Standing[];
  matches: Match[];
}) {
  const [cup, setCup] = useState<"pro" | "hobby">(myProgram);
  const ladder = cup === "pro" ? proLadder : hobbyLadder;
  const isMyCup = cup === myProgram;
  const myIdx = ladder.findIndex((r) => r.dite_id === myId);
  const me = myIdx >= 0 ? ladder[myIdx] : null;
  const top3 = ladder.slice(0, 3);
  const podClass = ["p2", "p1", "p3"];
  const order = [top3[1], top3[0], top3[2]];

  return (
    <div className="esport">
      <div className="es-bg" style={{ backgroundImage: `url(/assets/cup-${cup}.png)` }} />
      <div className="es-bgfade" />
      <div className="es-in2">
        <div className="es-head">
          <div>
            <div className="es-season">Sezóna 2026 · {ladder.length} {ladder.length === 1 ? "hráč" : ladder.length < 5 ? "hráči" : "hráčů"}</div>
            <div className="es-lab">{cup === "pro" ? "PRO" : "HOBBY"} · Sparing Cup</div>
            <h2>Žebříček sezóny</h2>
          </div>
          <div className="cup-switch">
            <button className={"hobby" + (cup === "hobby" ? " active" : "")} onClick={() => setCup("hobby")}>HOBBY</button>
            <button className={"pro" + (cup === "pro" ? " active" : "")} onClick={() => setCup("pro")}>PRO</button>
          </div>
        </div>

        {ladder.length === 0 ? (
          <p style={{ color: "#9fb4d1" }}>V {cup === "pro" ? "PRO" : "HOBBY"} poháru zatím nikdo neodehrál zápas.</p>
        ) : (
          <div className="es-grid">
            <div className="podium">
              {order.map((p, i) => {
                if (!p) return <div key={i} />;
                const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
                return (
                  <div className={"pod " + podClass[i] + (p.dite_id === myId ? " mine" : "")} key={p.dite_id}>
                    <span className="pmedal">
                      {rank === 1 ? <Trophy size={50} color="#e8b923" /> : <Medal size={42} color={rank === 2 ? "#c0c0c0" : "#cd7f32"} />}
                    </span>
                    <Av model={p.avatar_model} />
                    <div className="rk">{rank}</div>
                    <div className="nm">{jmenoV(p)}</div>
                    <div className="pt">
                      {p.body}{" "}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="bv-ic" src="/victory-point.png" alt="BV" />
                    </div>
                    <span className="step" />
                  </div>
                );
              })}
            </div>

            <div className="es-scorecol">
              {isMyCup && me ? (
                <>
                  <div className="es-score-h">Tvoje skóre</div>
                  <div className="vp-feature">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="vp-badge" src="/victory-point.png" alt="Body vítězství" />
                    <div>
                      <div className="vp-n">{me.body}</div>
                      <div className="vp-l">Body vítězství</div>
                    </div>
                  </div>
                  <div className="es-stats">
                    <div className="es-stat"><div className="n">{myIdx + 1}.</div><div className="l">v žebříčku</div></div>
                    <div className="es-stat"><div className="n">{me.vyhry}–{me.prohry}</div><div className="l">zápasy V–P</div></div>
                  </div>
                </>
              ) : !isMyCup ? (
                <p className="cup-note">V tomto poháru nesoutěžíš — hraješ v {myProgram === "pro" ? "PRO" : "HOBBY"} poháru.</p>
              ) : null}

              <div className="es-score-h" style={{ marginTop: ".2rem" }}>Celý žebříček</div>
              <div className="cup-rows">
                {ladder.map((p, i) => (
                  <div className={"es-row" + (p.dite_id === myId ? " me" : "")} key={p.dite_id}>
                    <div className={"r" + (i === 0 ? " gold" : "")}>{i + 1}</div>
                    <Av model={p.avatar_model} />
                    <div className="nm">{jmenoV(p)}</div>
                    <div className="wl">{p.vyhry}–{p.prohry}</div>
                    <div className="pt">
                      {p.body}{" "}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="bv-ic" src="/victory-point.png" alt="BV" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="es-rules">
          Zápas se hraje <b>minimálně na 4 gemy</b>, max <b>2 sety denně</b>. Každý vyhraný gem = <b>1 bod vítězství</b>{" "}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="vp-ic" src="/victory-point.png" alt="" />. Výsledky zadávají hráči, trenér je potvrdí.
        </div>

        <div className="es-score-h" style={{ marginTop: "1.4rem" }}>Historie zápasů</div>
        {matches.length === 0 ? (
          <p style={{ color: "#9fb4d1", fontSize: ".9rem" }}>Zatím žádné odehrané zápasy.</p>
        ) : (
          <div className="mh-list">
            {matches.map((m) => {
              const win = m.gemy_pro > m.gemy_proti;
              const draw = m.gemy_pro === m.gemy_proti;
              return (
                <div className={"mh-row " + (draw ? "draw" : win ? "win" : "loss")} key={m.id}>
                  <span className="mh-res">{draw ? "•" : win ? "V" : "P"}</span>
                  <span className="mh-date">{dm(m.datum)}</span>
                  <span className="mh-opp">{m.souper}</span>
                  <span className="mh-score">{m.gemy_pro}–{m.gemy_proti}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
