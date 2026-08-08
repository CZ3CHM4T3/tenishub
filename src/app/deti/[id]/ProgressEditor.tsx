"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  IC,
  Curriculum,
  nodesOf,
  nodeState,
  ancestorsOf,
  descendantsOf,
  childState,
  key as nkey,
  lvlThr,
  MAX_LEVEL,
  fmt,
  Node,
} from "@/lib/kariera";

export default function ProgressEditor({
  childId,
  adminId,
  initial,
  cur,
}: {
  childId: string;
  adminId: string;
  initial: string[];
  cur: Curriculum;
}) {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set(initial));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const st = useMemo(() => childState(unlocked, cur), [unlocked, cur]);
  const supabase = createClient();

  async function toggle(chapKey: string, node: Node) {
    const k = nkey(chapKey, node.id);
    const nodes = nodesOf(chapKey, cur);
    const prev = new Set(unlocked);

    if (!unlocked.has(k)) {
      // odemknout uzel + všechny předchůdce (kaskáda)
      const ids = [node.id, ...ancestorsOf(chapKey, node.id, cur)].filter((id) => !unlocked.has(nkey(chapKey, id)));
      const next = new Set(unlocked);
      ids.forEach((id) => next.add(nkey(chapKey, id)));
      setUnlocked(next);
      setSaving(true);
      setErr(null);
      const rows = ids.map((id) => ({
        dite_id: childId,
        kapitola: chapKey,
        uzel: id,
        xp: nodes.find((n) => n.id === id)?.xp ?? 0,
        odemkl: adminId,
      }));
      const { error } = await supabase.from("odemceno").upsert(rows, { onConflict: "dite_id,kapitola,uzel" });
      setSaving(false);
      if (error) {
        setUnlocked(prev);
        setErr(error.message);
      }
    } else {
      // odebrat uzel + všechny potomky (co na něm závisí)
      const ids = [node.id, ...descendantsOf(chapKey, node.id, cur)].filter((id) => unlocked.has(nkey(chapKey, id)));
      const next = new Set(unlocked);
      ids.forEach((id) => next.delete(nkey(chapKey, id)));
      setUnlocked(next);
      setSaving(true);
      setErr(null);
      const { error } = await supabase
        .from("odemceno")
        .delete()
        .eq("dite_id", childId)
        .eq("kapitola", chapKey)
        .in("uzel", ids);
      setSaving(false);
      if (error) {
        setUnlocked(prev);
        setErr(error.message);
      }
    }
  }

  const next = lvlThr(Math.min(st.level + 1, MAX_LEVEL), st.maxXp);

  return (
    <div>
      <div className="pe-head">
        <span className="lvl">
          <span className="erb" style={{ position: "relative", width: 34, lineHeight: 0, display: "inline-block" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/erb/${st.tier.e}.png`} alt="" style={{ width: "100%", display: "block" }} />
            <span
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--font-sora), sans-serif",
                fontWeight: 800,
                fontSize: ".72rem",
                color: "#fff",
                textShadow: "0 1px 3px rgba(0,0,0,.9)",
              }}
            >
              {st.level}
            </span>
          </span>
          Level {st.level} · {st.tier.n}
        </span>
        <span className="xp">
          <b>{fmt(st.totalXp)}</b> XP
          {st.level < MAX_LEVEL ? ` · do levelu ${st.level + 1}: ${fmt(next - st.totalXp)}` : " · MAX"}
        </span>
        <span className="pe-saveinfo">
          {saving ? "Ukládám…" : err ? "Chyba: " + err : "Uloženo ✓ · klikni na dovednost pro odemčení"}
        </span>
      </div>

      {(["kurt", "mimo"] as const).map((g) => (
        <div key={g}>
          <h3 style={{ margin: "1.2rem 0 .7rem" }}>{g === "kurt" ? "Na kurtu" : "Mimo kurt"}</h3>
          {cur.chapters.filter((c) => c.g === g).map((c) => {
            const cs = st.byChapter[c.k];
            return (
              <div className="pe-chap" key={c.k}>
                <div className="pe-chead">
                  <span className="ci" style={{ background: c.c }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: IC[c.k] }} />
                  </span>
                  <span className="nm">{c.n}</span>
                  <span className="pg">
                    {cs.done}/{cs.total} · {cs.pct} %
                  </span>
                </div>
                <div className="pe-nodes">
                  {nodesOf(c.k, cur).map((n) => {
                    const s = nodeState(c.k, n, unlocked);
                    return (
                      <button key={n.id} className={"pe-node " + s} onClick={() => toggle(c.k, n)} title={s === "locked" ? "Odemkne i vše před tím" : ""}>
                        <span className="dot">
                          {s === "done" && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          )}
                        </span>
                        {n.n}
                        <span className="x">+{n.xp}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
