"use client";

// Objednávka videorozboru: rodič vloží odkaz na video + kontakt + preferovaný termín.
// Uloží se do video_requests (RLS: insert smí kdokoli). Admin to pak řeší ručně.
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Video, Send, CheckCircle2, Link as LinkIcon } from "lucide-react";

export function VideoOrderForm() {
  const supabase = useMemo(() => createClient(), []);
  const [f, setF] = useState({ name: "", email: "", phone: "", player_age: "", video_url: "", note: "", preferred_at: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!f.name.trim() || !f.email.trim() || !f.video_url.trim()) return;
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("video_requests").insert({
      author_id: user?.id ?? null, name: f.name.trim(), email: f.email.trim(), phone: f.phone || null,
      player_age: f.player_age || null, video_url: f.video_url.trim(), note: f.note || null, preferred_at: f.preferred_at || null,
    });
    setBusy(false);
    if (error) { alert("Nepodařilo se odeslat: " + error.message); return; }
    setDone(true);
  };

  if (done) return (
    <div className="vro-card vro-done">
      <CheckCircle2 size={40} />
      <h3>Díky, máme to!</h3>
      <p>Ozveme se ti na <b>{f.email}</b> a domluvíme termín rozboru. Obvykle do 1–2 dnů.</p>
    </div>
  );

  const ready = f.name.trim() && f.email.trim() && f.video_url.trim();
  return (
    <div className="vro-card" id="objednat">
      <div className="vro-head"><Video size={20} /><h3>Objednat videorozbor</h3></div>
      <p className="vro-sub">Nahraj video na YouTube (i neveřejně) nebo Google Disk a vlož sem odkaz. Ozveme se a domluvíme 1:1 rozbor.</p>
      <div className="vro-grid">
        <label>Jméno *<input value={f.name} onChange={set("name")} placeholder="Jméno a příjmení" /></label>
        <label>E-mail *<input value={f.email} onChange={set("email")} type="email" placeholder="vas@email.cz" /></label>
        <label>Telefon<input value={f.phone} onChange={set("phone")} placeholder="nepovinné" /></label>
        <label>Věk / úroveň hráče<input value={f.player_age} onChange={set("player_age")} placeholder="např. 9 let, minitenis" /></label>
      </div>
      <label className="vro-full"><LinkIcon size={13} style={{ verticalAlign: "-2px" }} /> Odkaz na video *
        <input value={f.video_url} onChange={set("video_url")} placeholder="https://youtu.be/… nebo odkaz z Disku" />
      </label>
      <label className="vro-full">Co chcete rozebrat?
        <textarea rows={3} value={f.note} onChange={set("note")} placeholder="Technika, pohyb, hlava, ztráta radosti… napište, co vás trápí." />
      </label>
      <label className="vro-full">Preferovaný termín konzultace
        <input value={f.preferred_at} onChange={set("preferred_at")} placeholder="např. všední večery, víkend dopoledne" />
      </label>
      <button className="btn btn-gold" disabled={busy || !ready} onClick={submit} style={{ width: "100%" }}>
        <Send size={16} /> {busy ? "Odesílám…" : "Odeslat objednávku"}
      </button>
      <p className="vro-fine">Placená služba mimo HUB+. Cenu a termín potvrdíme e-mailem před rozborem — nic se neplatí předem.</p>
    </div>
  );
}
