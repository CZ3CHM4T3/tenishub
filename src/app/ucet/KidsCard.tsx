"use client";

// Fáze 1 — Děti v Profilu (jeden zdroj). Rodič si zadá dítě (jméno + rok narození);
// propíše se do deti (Můj klub / progress) i cesta_players (Moje cesta).
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Baby, Plus, Trash2, ArrowRight } from "lucide-react";

type Kid = { id: string; jmeno: string; datum_narozeni: string | null; program: string | null };

export default function KidsCard({ userId }: { userId: string }) {
  const [kids, setKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);
  const [jmeno, setJmeno] = useState("");
  const [rok, setRok] = useState("");
  const [program, setProgram] = useState("hobby");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const sb = createClient();
    const { data } = await sb.from("deti").select("id,jmeno,datum_narozeni,program").eq("rodic_id", userId).order("vytvoreno", { ascending: true });
    setKids((data as Kid[]) ?? []);
    setLoading(false);
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!jmeno.trim()) return;
    setBusy(true);
    const sb = createClient();
    const datum = rok.trim().length === 4 ? `${rok.trim()}-01-01` : null;
    const { data: kid, error } = await sb.from("deti").insert({ rodic_id: userId, jmeno: jmeno.trim(), datum_narozeni: datum, program }).select("id").single();
    if (error) { setBusy(false); alert("Nepodařilo se přidat: " + error.message); return; }
    // zrcadlo do Mojí cesty (hráč) — jeden zdroj, nezadává se dvakrát
    try {
      const { data: pl } = await sb.from("cesta_players").insert({
        owner_id: userId, name: jmeno.trim(), level: program === "pro" ? "competitive" : "hobby",
        birth_year: rok.trim().length === 4 ? Number(rok.trim()) : null,
      }).select("id").single();
      if (pl?.id && kid?.id) await sb.from("deti").update({ player_id: pl.id }).eq("id", kid.id);
    } catch { /* dítě je založené i bez zrcadla */ }
    setJmeno(""); setRok(""); setProgram("hobby"); setBusy(false);
    await load();
  };

  const remove = async (k: Kid) => {
    if (!confirm(`Smazat dítě „${k.jmeno}"? (Zůstane historie v Moje cesta, jen se odpojí.)`)) return;
    setBusy(true);
    const sb = createClient();
    await sb.from("deti").delete().eq("id", k.id);
    setBusy(false);
    await load();
  };

  const yearOf = (d: string | null) => (d ? new Date(d).getFullYear() : null);

  return (
    <div className="acct-card">
      <div className="acct-card-head"><Baby size={20} /><h2>Moje děti</h2></div>
      <p className="member-note">Zadej dítě jednou — propíše se do <b>Moje cesta</b> i do <b>Můj klub</b> (pokrok u trenéra). Napojení na trenéra a avatary řešíš v <Link href="/deti" style={{ color: "var(--gold)", fontWeight: 700 }}>Můj klub</Link>.</p>

      {loading ? <p className="member-note">Načítám…</p> : kids.length > 0 && (
        <div className="klub-list" style={{ marginBottom: "0.8rem" }}>
          {kids.map((k) => (
            <div className="deti-row" key={k.id}>
              <span className="klub-av">{k.jmeno.charAt(0).toUpperCase()}</span>
              <div style={{ flex: 1, minWidth: 0 }}><b>{k.jmeno}</b><span>{yearOf(k.datum_narozeni) ? `nar. ${yearOf(k.datum_narozeni)}` : "rok neuveden"} · {k.program === "pro" ? "závodní" : "hobby"}</span></div>
              <Link href={`/deti/${k.id}`} className="dite-cta" style={{ textDecoration: "none" }}>Otevřít <ArrowRight size={14} /></Link>
              <button className="cenik-del" onClick={() => remove(k)} disabled={busy} aria-label="Smazat"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="acct-grid">
        <div className="fld"><label>Jméno dítěte</label><input value={jmeno} onChange={(e) => setJmeno(e.target.value)} placeholder="Např. Klárka" /></div>
        <div className="fld"><label>Rok narození</label><input value={rok} onChange={(e) => setRok(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2014" inputMode="numeric" /></div>
        <div className="fld"><label>Úroveň</label>
          <select value={program} onChange={(e) => setProgram(e.target.value)}><option value="hobby">Hobby</option><option value="pro">Závodní</option></select>
        </div>
      </div>
      <button className="btn btn-green" disabled={busy || !jmeno.trim()} onClick={add}><Plus size={15} /> Přidat dítě</button>
    </div>
  );
}
