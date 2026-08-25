"use client";

// Šuplíky (skupiny) — trenér si roztřídí rodiče do skupin (věkové kategorie),
// pak podle nich cílí akce a filtruje. Součást modulu Komunita.
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FolderPlus, Trash2 } from "lucide-react";

type Group = { id: string; name: string };
type Member = { id: string; member_name: string | null; group_ids: string[] };

export function Skupiny({ coachId }: { coachId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [{ data: g }, { data: m }] = await Promise.all([
      supabase.from("coach_groups").select("id,name").eq("coach_id", coachId).order("created_at"),
      supabase.from("coach_roster").select("id,member_name,group_ids").eq("coach_id", coachId).eq("kind", "parent").eq("status", "active").order("member_name"),
    ]);
    setGroups((g as Group[]) ?? []);
    setMembers(((m as { id: string; member_name: string | null; group_ids: unknown }[]) ?? []).map((x) => ({ id: x.id, member_name: x.member_name, group_ids: Array.isArray(x.group_ids) ? (x.group_ids as string[]) : [] })));
  }, [supabase, coachId]);
  useEffect(() => { load(); }, [load]);

  const addGroup = async () => {
    if (!name.trim()) return;
    setBusy(true);
    await supabase.from("coach_groups").insert({ coach_id: coachId, name: name.trim() });
    setName(""); setBusy(false); load();
  };
  const delGroup = async (id: string) => {
    if (!confirm("Smazat skupinu? Členové zůstanou, jen ztratí tenhle štítek.")) return;
    await supabase.from("coach_groups").delete().eq("id", id);
    load();
  };
  const toggle = async (mem: Member, gid: string) => {
    const next = mem.group_ids.includes(gid) ? mem.group_ids.filter((x) => x !== gid) : [...mem.group_ids, gid];
    setMembers((ms) => ms.map((x) => (x.id === mem.id ? { ...x, group_ids: next } : x)));
    await supabase.from("coach_roster").update({ group_ids: next }).eq("id", mem.id);
  };

  return (
    <div className="acct-card">
      <div className="acct-card-head"><FolderPlus size={20} /><h2>Skupiny (šuplíky)</h2></div>
      <p className="member-note" style={{ marginTop: "-0.3rem" }}>Roztřiď rodiče do skupin (např. Babytenis, Minitenis, Starší žáci). Pak podle nich cílíš akce v kalendáři.</p>

      <div className="skup-new">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nová skupina — např. Babytenis 4–6" onKeyDown={(e) => { if (e.key === "Enter") addGroup(); }} />
        <button className="btn btn-green btn-sm" onClick={addGroup} disabled={busy || !name.trim()}>Přidat</button>
      </div>

      {groups.length > 0 && (
        <div className="skup-chips">
          {groups.map((g) => (
            <span className="skup-chip" key={g.id}>{g.name}<button className="skup-x" onClick={() => delGroup(g.id)} title="Smazat"><Trash2 size={12} /></button></span>
          ))}
        </div>
      )}

      {groups.length > 0 && members.length > 0 && (
        <div className="skup-members">
          {members.map((mem) => (
            <div className="skup-row" key={mem.id}>
              <span className="skup-name">{mem.member_name || "Rodič"}</span>
              <div className="skup-toggles">
                {groups.map((g) => (
                  <button key={g.id} type="button" className={`skup-tog${mem.group_ids.includes(g.id) ? " on" : ""}`} onClick={() => toggle(mem, g.id)}>{g.name}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {groups.length > 0 && members.length === 0 && <p className="member-note" style={{ marginTop: ".8rem" }}>Zatím žádní rodiče v komunitě — jakmile se přidají, zařadíš je sem do skupin.</p>}
    </div>
  );
}
