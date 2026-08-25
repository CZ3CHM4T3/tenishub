"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Check, UserPlus } from "lucide-react";

type Trainer = { id: string; owner_id: string; name: string; city: string | null };

export function JoinCoach() {
  const supabase = useMemo(() => createClient(), []);
  const [me, setMe] = useState("");
  const [status, setStatus] = useState<"none" | "pending" | "active">("none");
  const [coachName, setCoachName] = useState("");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Trainer[]>([]);
  const [busy, setBusy] = useState(false);

  const loadMine = async (uid: string) => {
    const { data } = await supabase.from("coach_roster").select("coach_id,status").eq("member_id", uid).in("status", ["pending", "active"]).limit(1).maybeSingle();
    if (!data) { setStatus("none"); return; }
    setStatus((data as { status: string }).status === "active" ? "active" : "pending");
    const { data: sp } = await supabase.from("specialists").select("name").eq("owner_id", (data as { coach_id: string }).coach_id).limit(1).maybeSingle();
    setCoachName((sp as { name: string } | null)?.name ?? "trenér");
  };
  useEffect(() => { (async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return; setMe(user.id); loadMine(user.id); })(); }, [supabase]);

  const search = async (val: string) => {
    setQ(val);
    if (val.trim().length < 2) { setResults([]); return; }
    const { data } = await supabase.from("specialists").select("id,owner_id,name,city").not("owner_id", "is", null).ilike("name", `%${val.trim()}%`).limit(8);
    setResults((data as Trainer[]) ?? []);
  };
  const join = async (t: Trainer) => {
    setBusy(true);
    const { error } = await supabase.rpc("request_join_coach", { p_coach: t.owner_id });
    setBusy(false);
    if (error) { alert(error.message); return; }
    setStatus("pending"); setCoachName(t.name); setResults([]); setQ("");
  };
  const leave = async () => {
    if (!confirm("Zrušit propojení s trenérem?")) return;
    await supabase.from("coach_roster").delete().eq("member_id", me);
    setStatus("none"); setCoachName("");
  };

  if (status === "active") return (
    <div className="jc-card jc-active"><span className="jc-ic"><Check size={16} /></span> Jste v komunitě trenéra <b>{coachName}</b>. <button className="ma-link" onClick={leave}>Odejít</button></div>
  );
  if (status === "pending") return (
    <div className="jc-card"><span className="jc-dot" /> Žádost odeslána trenérovi <b>{coachName}</b> — čekáte na potvrzení. <button className="ma-link" onClick={leave}>Zrušit žádost</button></div>
  );

  return (
    <div className="jc-card">
      <div className="jc-head"><UserPlus size={18} /> <b>Máte trenéra? Připojte se k jeho klubu</b></div>
      <p className="member-note" style={{ margin: ".2rem 0 .7rem" }}>Napište jméno trenéra a vyberte ze seznamu. Nebo pokračujte <b>solo</b> — trenéra doplníte kdykoli.</p>
      <div className="jc-search"><Search size={16} /><input value={q} onChange={(e) => search(e.target.value)} placeholder="Jméno trenéra…" /></div>
      {results.length > 0 && (
        <div className="jc-results">
          {results.map((t) => (
            <button key={t.id} className="jc-res" disabled={busy} onClick={() => join(t)}>
              <span><b>{t.name}</b>{t.city && <em> · {t.city}</em>}</span><span className="jc-addb">Připojit se</span>
            </button>
          ))}
        </div>
      )}
      {q.trim().length >= 2 && results.length === 0 && <p className="member-note">Nikdo takový. Zkuste jiné jméno, nebo pokračujte solo.</p>}
    </div>
  );
}
