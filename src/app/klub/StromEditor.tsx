"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  IC,
  DEFAULT_KURIKULA,
  TRACKS,
  SKILL_ICONS,
  SKILL_ICON_LIST,
  iconPathOf,
  xreqInfo,
  cloneCurriculum,
  chapMaxXP,
  totalMaxXP,
  fmt,
  type Curriculum,
  type Kurikula,
  type Track,
  type Chapter,
  type Node,
} from "@/lib/kariera";

function fmtDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });
}
function SkillGlyph({ path }: { path: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: path }} />;
}

const PALETA = [
  "#7aa11a", "#8ab028", "#5f9e2e", "#4f9440", "#3b82f6", "#a855f7",
  "#ef4444", "#f59e0b", "#0ea5e9", "#14b8a6", "#f97316", "#ec4899",
  "#22c55e", "#6366f1", "#eab308", "#06b6d4",
];

// rozměry plátna
const CW = 235, CH = 130, PADX = 70, PADY = 70, NODE_W = 176;

function cloneKur(k: Kurikula): Kurikula {
  return {
    tracks: {
      mini: cloneCurriculum(k.tracks.mini),
      junior: cloneCurriculum(k.tracks.junior),
      adults: cloneCurriculum(k.tracks.adults),
    },
  };
}
function newChapKey(cur: Curriculum): string {
  let i = 1;
  while (cur.chapters.some((c) => c.k === "kap" + i)) i++;
  return "kap" + i;
}
function newNodeId(nodes: Node[]): string {
  let i = 1;
  while (nodes.some((n) => n.id === "u" + i)) i++;
  return "u" + i;
}

// ---- automatické rozmístění stromu z návazností (req) ----
function layout(nodes: Node[]) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const primary = (n: Node) => n.req.find((r) => byId.has(r)) ?? null;
  const kids = new Map<string, string[]>(nodes.map((n) => [n.id, []]));
  const roots: string[] = [];
  nodes.forEach((n) => {
    const p = primary(n);
    if (p && kids.has(p)) kids.get(p)!.push(n.id);
    else roots.push(n.id);
  });
  const col = new Map<string, number>();
  const calcCol = (id: string, seen = new Set<string>()): number => {
    if (col.has(id)) return col.get(id)!;
    if (seen.has(id)) return 0;
    seen.add(id);
    const n = byId.get(id)!;
    const ps = n.req.filter((r) => byId.has(r));
    const c = ps.length ? Math.max(...ps.map((p) => calcCol(p, seen))) + 1 : 0;
    col.set(id, c);
    return c;
  };
  nodes.forEach((n) => calcCol(n.id));
  const row = new Map<string, number>();
  let counter = 0;
  const assign = (id: string, seen = new Set<string>()): number => {
    if (row.has(id)) return row.get(id)!;
    if (seen.has(id)) return counter++;
    seen.add(id);
    const cs = kids.get(id) ?? [];
    let r: number;
    if (!cs.length) r = counter++;
    else {
      const rs = cs.map((c) => assign(c, seen));
      r = rs.reduce((a, b) => a + b, 0) / rs.length;
    }
    row.set(id, r);
    return r;
  };
  roots.forEach((rid) => assign(rid));
  nodes.forEach((n) => { if (!row.has(n.id)) row.set(n.id, counter++); });
  return { col, row, kids };
}

// zapiš vypočtené col/row zpět do dat (kvůli zobrazení v Kariéře)
function bakeLayout(cur: Curriculum): Curriculum {
  const d = cloneCurriculum(cur);
  Object.keys(d.trees).forEach((k) => {
    const ns = d.trees[k];
    if (!ns.length) return;
    const { col, row } = layout(ns);
    const ranks = [...new Set(ns.map((n) => row.get(n.id)!))].sort((a, b) => a - b);
    const rankOf = new Map(ranks.map((v, i) => [v, i]));
    ns.forEach((n) => {
      n.col = col.get(n.id) ?? 0;
      n.row = rankOf.get(row.get(n.id)!) ?? 0;
    });
  });
  return d;
}

export default function StromEditor({ initial }: { initial: Kurikula }) {
  const [kur, setKur] = useState<Kurikula>(() => cloneKur(initial));
  const [track, setTrack] = useState<Track | null>(null);
  const [sel, setSel] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showPal, setShowPal] = useState(false);
  const [history, setHistory] = useState<Kurikula[]>([]);
  const [editedTracks, setEditedTracks] = useState<Set<Track>>(new Set());
  const [iconFor, setIconFor] = useState<string | null>(null);
  const [descFor, setDescFor] = useState<string | null>(null);
  const [xrFor, setXrFor] = useState<string | null>(null);
  const supabase = createClient();

  const cur: Curriculum | null = track ? kur.tracks[track] : null;
  const chap = cur?.chapters.find((c) => c.k === sel) ?? null;
  const nodes = chap && cur ? cur.trees[chap.k] ?? [] : [];

  const stats = useMemo(() => (cur ? { maxXp: totalMaxXP(cur), chapters: cur.chapters.length } : { maxXp: 0, chapters: 0 }), [cur]);
  const view = useMemo(() => layout(nodes), [nodes]);

  function openTrack(t: Track) {
    setTrack(t);
    setSel(kur.tracks[t].chapters[0]?.k ?? "");
    setShowPal(false);
    setMsg(null);
  }

  const maxCol = nodes.length ? Math.max(...nodes.map((n) => view.col.get(n.id)!)) : 0;
  const rowVals = nodes.map((n) => view.row.get(n.id)!);
  const maxRow = rowVals.length ? Math.max(...rowVals) : 0;
  const minRow = rowVals.length ? Math.min(...rowVals) : 0;
  const canvasW = maxCol * CW + PADX * 2 + NODE_W;
  const canvasH = (maxRow - minRow) * CH + PADY * 2 + 96;
  const pos = (id: string) => ({
    x: PADX + view.col.get(id)! * CW,
    y: PADY + (view.row.get(id)! - minRow) * CH,
  });

  function edit(fn: (d: Curriculum) => void) {
    if (!track) return;
    setKur((prev) => { const d = cloneKur(prev); fn(d.tracks[track]); return d; });
    setEditedTracks((prev) => { const s = new Set(prev); s.add(track); return s; });
    setDirty(true);
    setMsg(null);
  }
  // ulož snapshot pro Zpět (jen u strukturálních změn, ne u psaní)
  function snapshot() {
    setHistory((h) => [...h.slice(-59), cloneKur(kur)]);
  }
  function undo() {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setKur(prev);
      setDirty(true);
      setMsg(null);
      setIconFor(null);
      setDescFor(null);
      return h.slice(0, -1);
    });
  }

  // ---- KAPITOLY ----
  function addChapter() {
    if (!cur) return;
    snapshot();
    const k = newChapKey(cur);
    edit((d) => {
      d.chapters.push({ k, n: "Nová kapitola", c: PALETA[d.chapters.length % PALETA.length], g: "mimo" });
      d.trees[k] = [{ id: "u1", n: "Základ", xp: 20, col: 0, row: 0, req: [] }];
    });
    setSel(k);
  }
  function delChapter(k: string) {
    if (!cur) return;
    if (!confirm("Smazat celou kapitolu i její strom?")) return;
    snapshot();
    const nextSel = cur.chapters.find((c) => c.k !== k)?.k ?? "";
    edit((d) => { d.chapters = d.chapters.filter((c) => c.k !== k); delete d.trees[k]; });
    setSel(nextSel);
  }
  function patchChapter(patch: Partial<Chapter>) {
    if (!chap) return;
    edit((d) => { const c = d.chapters.find((x) => x.k === chap.k); if (c) Object.assign(c, patch); });
  }

  // ---- UZLY ----
  function addRoot() {
    if (!chap) return;
    snapshot();
    edit((d) => {
      const ns = d.trees[chap.k] ?? (d.trees[chap.k] = []);
      ns.push({ id: newNodeId(ns), n: "Nová dovednost", xp: 20, col: 0, row: 0, req: [] });
    });
  }
  function addBranch(parentId: string) {
    if (!chap) return;
    snapshot();
    edit((d) => {
      const ns = d.trees[chap.k];
      const parent = ns.find((n) => n.id === parentId);
      ns.push({ id: newNodeId(ns), n: "Nová dovednost", xp: parent ? parent.xp + 10 : 30, col: 0, row: 0, req: [parentId] });
    });
  }
  function delNode(id: string) {
    if (!chap || !cur) return;
    // smaž uzel + celou jeho větev (potomky přes primární rodičovství)
    const ns = cur.trees[chap.k] ?? [];
    const byId = new Map(ns.map((n) => [n.id, n]));
    const primary = (n: Node) => n.req.find((r) => byId.has(r)) ?? null;
    const kill = new Set<string>([id]);
    let changed = true;
    while (changed) {
      changed = false;
      ns.forEach((n) => { if (!kill.has(n.id) && primary(n) && kill.has(primary(n)!)) { kill.add(n.id); changed = true; } });
    }
    const cnt = kill.size;
    if (cnt > 1 && !confirm(`Opravdu smazat tuto dovednost a ${cnt - 1} navazujících? Tuto akci lze vzít zpět tlačítkem Zpět.`)) return;
    snapshot();
    edit((d) => {
      d.trees[chap.k] = d.trees[chap.k].filter((n) => !kill.has(n.id)).map((n) => ({ ...n, req: n.req.filter((r) => !kill.has(r)) }));
    });
    setIconFor(null);
    setDescFor(null);
  }
  function patchNode(id: string, patch: Partial<Node>) {
    if (!chap) return;
    edit((d) => { const n = d.trees[chap.k].find((x) => x.id === id); if (n) Object.assign(n, patch); });
  }
  // kombo prerekvizita z jiného stromu (klíč "kapitola:uzel")
  function toggleXreq(id: string, xkey: string) {
    if (!chap) return;
    edit((d) => {
      const n = d.trees[chap.k].find((x) => x.id === id);
      if (!n) return;
      const cur2 = n.xreq ?? [];
      n.xreq = cur2.includes(xkey) ? cur2.filter((k) => k !== xkey) : [...cur2, xkey];
    });
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const now = new Date().toISOString();
    const updated: Partial<Record<Track, string>> = { ...(kur.updated ?? {}) };
    editedTracks.forEach((t) => { updated[t] = now; });
    const baked: Kurikula = {
      tracks: {
        mini: bakeLayout(kur.tracks.mini),
        junior: bakeLayout(kur.tracks.junior),
        adults: bakeLayout(kur.tracks.adults),
      },
      updated,
    };
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("coach_kurikulum")
      .upsert({ coach_id: user?.id, data: baked, updated_at: now }, { onConflict: "coach_id" });
    setSaving(false);
    if (error) setMsg("Chyba při ukládání: " + error.message);
    else {
      setKur(baked);
      setDirty(false);
      setHistory([]);
      setEditedTracks(new Set());
      setMsg("Uloženo ✓ — body a levely se všem dětem přepočítají.");
    }
  }
  function resetDefault() {
    if (!confirm("Vrátit VŠECHNY věkové kategorie do výchozího stavu? (uložíš tlačítkem)")) return;
    snapshot();
    setKur({ ...cloneKur(DEFAULT_KURIKULA), updated: kur.updated });
    setEditedTracks(new Set(["mini", "junior", "adults"]));
    if (track) setSel(DEFAULT_KURIKULA.tracks[track].chapters[0]?.k ?? "");
    setDirty(true);
    setMsg(null);
  }

  return (
    <div className="ke">
      {/* horní lišta: navigace + uložit (vždy viditelná) */}
      <div className="ke-top">
        {track ? (
          <button className="ke-back" onClick={() => { setTrack(null); setShowPal(false); }}>← Věkové kategorie</button>
        ) : (
          <h2 className="ke-title">Vyber věkovou kategorii</h2>
        )}
        <div className="ke-savebox">
          {track && <span className="ke-maxxp">max {fmt(stats.maxXp)} XP</span>}
          <button className="btn2 ghost ke-undo" onClick={undo} disabled={!history.length} title="Vzít zpět poslední změnu">
            ↶ Zpět{history.length ? ` (${history.length})` : ""}
          </button>
          <button className="btn2 ghost" onClick={resetDefault}>Výchozí</button>
          <button className="btn2" onClick={save} disabled={saving || !dirty}>
            {saving ? "Ukládám…" : dirty ? "Uložit" : "Uloženo ✓"}
          </button>
        </div>
      </div>
      {msg && <div className={"ke-msg" + (msg.startsWith("Chyba") ? " err" : "")}>{msg}</div>}

      {/* DLAŽDICE — výběr věkové kategorie */}
      {!track && (
        <div className="ke-tiles">
          {TRACKS.map((t) => {
            const c = kur.tracks[t.k];
            return (
              <button key={t.k} className="ke-tile" onClick={() => openTrack(t.k)}>
                <span className="ke-tile-emoji">{t.emoji}</span>
                <span className="ke-tile-n">{t.n}</span>
                <span className="ke-tile-h">{t.hint}</span>
                <span className="ke-tile-s">{c.chapters.length} kapitol · {fmt(totalMaxXP(c))} XP</span>
                <span className="ke-tile-upd">
                  {editedTracks.has(t.k) ? "neuloženo…" : kur.updated?.[t.k] ? `upraveno ${fmtDate(kur.updated[t.k])}` : "beze změn"}
                </span>
                <span className="ke-tile-go">Upravit strom →</span>
              </button>
            );
          })}
        </div>
      )}

      {/* EDITOR VYBRANÉ KATEGORIE */}
      {track && cur && (
        <div className="ke-bar">
          <div className="ke-chips">
            {(["kurt", "mimo"] as const).flatMap((g) =>
              cur.chapters.filter((c) => c.g === g).map((c) => (
                <button key={c.k} className={"ke-chip" + (c.k === sel ? " on" : "")} style={{ ["--cc" as string]: c.c }} onClick={() => { setSel(c.k); setShowPal(false); }}>
                  <span className="ke-dot" style={{ background: c.c }} />
                  {c.n}
                  <span className="ke-cnt">{(cur.trees[c.k] ?? []).length}</span>
                </button>
              ))
            )}
            <button className="ke-chip add" onClick={addChapter}>+ kapitola</button>
          </div>
        </div>
      )}

      {track && cur && chap && (
        <>
          {/* lišta kapitoly */}
          <div className="ke-chline">
            <span className="ke-cico" style={{ background: chap.c }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: IC[chap.k] ?? IC.uder }} />
            </span>
            <input className="ke-chname" value={chap.n} onChange={(e) => patchChapter({ n: e.target.value })} />
            <div className="ke-colorwrap">
              <button className="ke-colorbtn" style={{ background: chap.c }} onClick={() => setShowPal((s) => !s)} title="Barva" />
              {showPal && (
                <div className="ke-palpop">
                  {PALETA.map((p) => (
                    <button key={p} className={"ke-sw" + (p === chap.c ? " on" : "")} style={{ background: p }} onClick={() => { patchChapter({ c: p }); setShowPal(false); }} />
                  ))}
                </div>
              )}
            </div>
            <select className="ke-grp" value={chap.g} onChange={(e) => patchChapter({ g: e.target.value as "kurt" | "mimo" })}>
              <option value="kurt">Na kurtu</option>
              <option value="mimo">Mimo kurt</option>
            </select>
            <span className="ke-chmax">{fmt(chapMaxXP(chap.k, cur))} XP</span>
            <button className="ke-delchap" onClick={() => delChapter(chap.k)}>Smazat kapitolu</button>
          </div>

          {/* PLÁTNO STROMU */}
          <div className="ke-stage">
            {nodes.length === 0 ? (
              <div className="ke-empty">
                <p>Kapitola je prázdná.</p>
                <button className="ke-bigadd" onClick={addRoot}>+ přidat první dovednost</button>
              </div>
            ) : (
              <div className="ke-canvas" style={{ width: canvasW, height: canvasH, ["--cc" as string]: chap.c }}>
                <svg className="ke-lines" width={canvasW} height={canvasH}>
                  {nodes.flatMap((n) =>
                    n.req.filter((r) => nodes.some((x) => x.id === r)).map((r) => {
                      const a = pos(r), b = pos(n.id);
                      return <line key={r + "-" + n.id} x1={a.x + NODE_W} y1={a.y + 40} x2={b.x} y2={b.y + 40} stroke={chap.c} strokeWidth={3} strokeLinecap="round" opacity={0.6} />;
                    })
                  )}
                </svg>
                {nodes.map((n) => {
                  const p = pos(n.id);
                  return (
                    <div key={n.id} className="ke-tn" style={{ left: p.x, top: p.y, width: NODE_W }}>
                      <button className="ke-tn-del" onClick={() => delNode(n.id)} title="Smazat dovednost">×</button>
                      <div className="ke-tn-head">
                        <button className="ke-tn-ico" onClick={() => { setIconFor((v) => (v === n.id ? null : n.id)); setDescFor(null); }} title="Změnit ikonu">
                          <SkillGlyph path={iconPathOf(n)} />
                        </button>
                        <button className={"ke-tn-info" + (n.desc ? " has" : "")} onClick={() => { setDescFor((v) => (v === n.id ? null : n.id)); setIconFor(null); setXrFor(null); }} title={n.desc || "Přidat vysvětlivku"}>
                          i
                        </button>
                        <button className={"ke-tn-xr" + (n.xreq && n.xreq.length ? " has" : "")} onClick={() => { setXrFor((v) => (v === n.id ? null : n.id)); setIconFor(null); setDescFor(null); }} title="Kombo prerekvizita z jiného stromu">
                          🔗{n.xreq && n.xreq.length ? <span className="ke-xr-cnt">{n.xreq.length}</span> : null}
                        </button>
                      </div>
                      <input className="ke-tn-name" value={n.n} onChange={(e) => patchNode(n.id, { n: e.target.value })} placeholder="Název" />
                      <div className="ke-tn-foot">
                        <label className="ke-tn-xp">
                          <input type="number" min={0} value={n.xp} onChange={(e) => patchNode(n.id, { xp: Math.max(0, Number(e.target.value) || 0) })} />
                          <span>XP</span>
                        </label>
                      </div>
                      <button className="ke-tn-branch" onClick={() => addBranch(n.id)} title="Přidat větev">+</button>

                      {iconFor === n.id && (
                        <div className="ke-iconpop">
                          {SKILL_ICON_LIST.map((ic) => (
                            <button key={ic.k} className={"ke-ic" + (iconPathOf(n) === SKILL_ICONS[ic.k] ? " on" : "")} title={ic.label} onClick={() => { patchNode(n.id, { icon: ic.k }); setIconFor(null); }}>
                              <SkillGlyph path={SKILL_ICONS[ic.k]} />
                            </button>
                          ))}
                        </div>
                      )}
                      {descFor === n.id && (
                        <div className="ke-descpop">
                          <textarea value={n.desc ?? ""} onChange={(e) => patchNode(n.id, { desc: e.target.value })} placeholder="Vysvětlivka — co to je a jak poznat, že to dítě zvládlo. (uvidí se po najetí na ⓘ)" rows={4} />
                          <button className="ke-descclose" onClick={() => setDescFor(null)}>Hotovo</button>
                        </div>
                      )}
                      {xrFor === n.id && (
                        <div className="ke-xrpop">
                          <div className="ke-xr-h">Kombo prerekvizity <span>— tuto dovednost odemkne až splnění vybraných z jiných stromů</span></div>
                          {cur.chapters.filter((c) => c.k !== chap.k).map((c) => {
                            const cns = cur.trees[c.k] ?? [];
                            if (!cns.length) return null;
                            return (
                              <div className="ke-xr-chap" key={c.k}>
                                <div className="ke-xr-cn"><span className="ke-xr-dot" style={{ background: c.c }} />{c.n}</div>
                                <div className="ke-xr-skills">
                                  {cns.map((sn) => {
                                    const xk = `${c.k}:${sn.id}`;
                                    const on = (n.xreq ?? []).includes(xk);
                                    return (
                                      <button key={xk} className={"ke-xr-skill" + (on ? " on" : "")} onClick={() => toggleXreq(n.id, xk)}>
                                        <SkillGlyph path={iconPathOf(sn)} /> {sn.n}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                          <button className="ke-descclose" onClick={() => setXrFor(null)}>Hotovo</button>
                        </div>
                      )}
                      {n.xreq && n.xreq.length > 0 && xrFor !== n.id && (
                        <div className="ke-tn-reqline">
                          🔗 {n.xreq.map((xk) => { const info = xreqInfo(cur, xk); return info ? <span key={xk} className="ke-reqchip" title={`Vyžaduje: ${info.name} (${info.chapName})`}><SkillGlyph path={info.icon} />{info.name}</span> : null; })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {nodes.length > 0 && (
            <div className="ke-stagehint">
              <button className="ke-rootadd" onClick={addRoot}>+ nová větev od začátku</button>
              <span>Klikni <b>+</b> na dovednosti pro navazující větev · <b>×</b> smaže ji i vše za ní · šoupej doprava k pokročilejším</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
