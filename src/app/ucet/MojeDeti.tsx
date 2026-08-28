"use client";

// Správa dětí — vlastní záložka v Profilu. Odtud se děti načítají do všeho
// (Moje cesta, klub trenéra, Sparring Cup). Přidání dítěte se zrcadlí do cesta_players.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Baby, Plus, X, ArrowRight, Pencil, Route } from "lucide-react";
import { AVATARS, avatarByKey } from "@/lib/avatars";

type Dite = { id: string; jmeno: string; prezdivka: string | null; level: number; program: string; coach_id: string | null; avatar: string | null };

export default function MojeDeti({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [deti, setDeti] = useState<Dite[]>([]);
  const [form, setForm] = useState({ open: false, jmeno: "", datum: "", program: "hobby" });
  const [avatarFor, setAvatarFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("deti").select("id,jmeno,prezdivka,level,program,coach_id,avatar").eq("rodic_id", userId).order("vytvoreno", { ascending: true });
    setDeti((data as Dite[]) ?? []);
    setLoading(false);
  }, [supabase, userId]);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.jmeno.trim()) return;
    setBusy(true);
    const { data: kid, error } = await supabase.from("deti").insert({
      rodic_id: userId, jmeno: form.jmeno.trim(), datum_narozeni: form.datum || null, program: form.program,
    }).select("id").single();
    if (error) { setBusy(false); alert("Nepodařilo se přidat: " + error.message); return; }
    // zrcadlo do Mojí cesty — dítě se nezadává dvakrát (best-effort)
    try {
      const { data: pl } = await supabase.from("cesta_players").insert({ owner_id: userId, name: form.jmeno.trim() }).select("id").single();
      if (pl?.id && kid?.id) await supabase.from("deti").update({ player_id: pl.id }).eq("id", kid.id);
    } catch { /* dítě je založené, jen se nezrcadlilo */ }
    setBusy(false);
    setForm({ open: false, jmeno: "", datum: "", program: "hobby" });
    await load();
  };

  const chooseAvatar = async (kidId: string, key: string) => {
    setAvatarFor(null);
    setDeti((ds) => ds.map((x) => x.id === kidId ? { ...x, avatar: key } : x));
    await supabase.from("deti").update({ avatar: key }).eq("id", kidId);
  };

  return (
    <div className="acct-card">
      <div className="acct-card-head" style={{ justifyContent: "space-between" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: ".6rem" }}><Baby size={20} /><h2>Moje děti</h2></span>
        {deti.length > 0 && <button className="btn btn-green" style={{ padding: ".45rem .85rem", fontSize: ".85rem" }} onClick={() => setForm((f) => ({ ...f, open: true }))}><Plus size={15} /> Přidat dítě</button>}
      </div>
      <p className="member-note">Děti přidáš jednou tady — odtud se propíšou do <b>Mojí cesty</b>, klubu trenéra i Sparring Cupu. Otevři profil dítěte pro kariéru a pokrok.</p>

      {loading ? (
        <p className="member-note">Načítám…</p>
      ) : deti.length === 0 ? (
        <div className="acct-card mc-gate" style={{ margin: 0 }}>
          <Baby size={30} /><h2>Zatím žádné dítě</h2>
          <p>Přidej první — pak ho napojíš na trenéra (v „Můj klub") a uvidíš jeho pokrok.</p>
          <button className="btn btn-green" onClick={() => setForm((f) => ({ ...f, open: true }))}><Plus size={16} /> Přidat dítě</button>
        </div>
      ) : (
        <div className="klub-list">
          {deti.map((d) => {
            const av = avatarByKey(d.avatar);
            const AvIcon = av.Icon;
            return (
              <div className={`deti-row${d.coach_id ? "" : " deti-row-off"}`} key={d.id}>
                <button type="button" className="deti-av" style={{ background: av.color }} onClick={() => setAvatarFor(d.id)} aria-label="Změnit avatara">
                  <AvIcon size={22} /><span className="deti-av-edit"><Pencil size={11} /></span>
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{d.jmeno}</b>
                  <span>{d.program === "pro" ? "závodní" : "hobby"}{d.coach_id ? ` · u trenéra · level ${d.level}` : " · zatím bez trenéra"}</span>
                </div>
                <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <Link href="/moje-cesta" className="btn btn-out" style={{ padding: ".4rem .7rem", fontSize: ".82rem" }}><Route size={14} /> Cesta</Link>
                  <Link href={`/deti/${d.id}`} className="dite-cta" style={{ textDecoration: "none" }}>Profil <ArrowRight size={15} /></Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {form.open && (
        <div className="mc-modal" onClick={() => setForm((f) => ({ ...f, open: false }))}>
          <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
            <button className="mc-x" onClick={() => setForm((f) => ({ ...f, open: false }))}><X size={18} /></button>
            <h3>Přidat dítě</h3>
            <label>Jméno dítěte<input value={form.jmeno} onChange={(e) => setForm({ ...form, jmeno: e.target.value })} placeholder="Např. Ella" autoFocus /></label>
            <div className="mc-row2">
              <label>Datum narození<input type="date" value={form.datum} onChange={(e) => setForm({ ...form, datum: e.target.value })} /></label>
              <label>Program<select value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })}><option value="hobby">Hobby</option><option value="pro">Závodní</option></select></label>
            </div>
            <button className="btn btn-green" disabled={busy || !form.jmeno.trim()} onClick={submit}>Přidat</button>
          </div>
        </div>
      )}

      {avatarFor && (
        <div className="mc-modal" onClick={() => setAvatarFor(null)}>
          <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
            <button className="mc-x" onClick={() => setAvatarFor(null)}><X size={18} /></button>
            <h3>Vyber avatara</h3>
            <div className="avatar-grid">
              {AVATARS.map((a) => {
                const AIcon = a.Icon;
                const cur = deti.find((x) => x.id === avatarFor)?.avatar;
                return (
                  <button key={a.key} type="button" className={`avatar-opt${cur === a.key ? " on" : ""}`} style={{ background: a.color }} onClick={() => chooseAvatar(avatarFor, a.key)}>
                    <AIcon size={26} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
