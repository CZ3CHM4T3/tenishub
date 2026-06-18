"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Route, Plus, Trash2, Save } from "lucide-react";

type EvType = { key: string; label: string; color: string };
type PhaseT = { kind: string; label: string; color: string; start: string; end: string };

const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "typ";

export default function AdminCesta() {
  const [types, setTypes] = useState<EvType[]>([]);
  const [phases, setPhases] = useState<PhaseT[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const sb = createClient();
    const { data } = await sb.from("cesta_settings").select("event_types,season_template").eq("id", 1).maybeSingle();
    setTypes((data?.event_types as EvType[]) ?? []);
    setPhases((data?.season_template as PhaseT[]) ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setBusy(true); setSaved(false);
    const sb = createClient();
    const cleanTypes = types.filter((t) => t.label.trim()).map((t) => ({ ...t, key: t.key || slug(t.label) }));
    const { error } = await sb.from("cesta_settings").update({
      event_types: cleanTypes, season_template: phases, updated_at: new Date().toISOString(),
    }).eq("id", 1);
    if (error) alert("Uložení selhalo: " + error.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    setBusy(false);
  };

  if (loading) return <p className="member-note">Načítám nastavení…</p>;

  return (
    <div className="acct-card">
      <div className="acct-card-head"><Route size={20} /><h2>Moje cesta — nastavení</h2>
        <button className="btn btn-gold" style={{ marginLeft: "auto" }} disabled={busy} onClick={save}>
          <Save size={15} /> {saved ? "Uloženo ✓" : "Uložit změny"}
        </button>
      </div>

      <h3 className="mc-adm-h">Typy událostí (barvy v kalendáři)</h3>
      <div className="mc-adm-rows">
        {types.map((t, i) => (
          <div className="mc-adm-row" key={i}>
            <input type="color" value={t.color} onChange={(e) => setTypes(types.map((x, j) => j === i ? { ...x, color: e.target.value } : x))} />
            <input value={t.label} placeholder="Název" onChange={(e) => setTypes(types.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
            <button className="linklike danger" onClick={() => setTypes(types.filter((_, j) => j !== i))}><Trash2 size={15} /></button>
          </div>
        ))}
        <button className="btn btn-out btn-sm" onClick={() => setTypes([...types, { key: "", label: "", color: "#7C4DD6" }])}><Plus size={14} /> Přidat typ</button>
      </div>

      <h3 className="mc-adm-h">Fáze sezóny (osa) — datum ve formátu MM-DD</h3>
      <div className="mc-adm-rows">
        {phases.map((p, i) => (
          <div className="mc-adm-row mc-adm-phase" key={i}>
            <input type="color" value={p.color} onChange={(e) => setPhases(phases.map((x, j) => j === i ? { ...x, color: e.target.value } : x))} />
            <input value={p.label} placeholder="Název fáze" onChange={(e) => setPhases(phases.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
            <input value={p.start} placeholder="04-01" className="mc-adm-md" onChange={(e) => setPhases(phases.map((x, j) => j === i ? { ...x, start: e.target.value } : x))} />
            <span>→</span>
            <input value={p.end} placeholder="09-30" className="mc-adm-md" onChange={(e) => setPhases(phases.map((x, j) => j === i ? { ...x, end: e.target.value } : x))} />
            <button className="linklike danger" onClick={() => setPhases(phases.filter((_, j) => j !== i))}><Trash2 size={15} /></button>
          </div>
        ))}
        <button className="btn btn-out btn-sm" onClick={() => setPhases([...phases, { kind: "custom", label: "", color: "#cdd3da", start: "01-01", end: "12-31" }])}><Plus size={14} /> Přidat fázi</button>
      </div>

      <p className="member-note" style={{ marginTop: "0.8rem" }}>
        Pořadí fází = pořadí v sezóně (začíná přípravou). Změny se projeví všem hráčům po uložení.
      </p>
    </div>
  );
}
