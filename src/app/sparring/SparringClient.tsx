"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";
import { CITIES } from "@/lib/cities";
import { Handshake, MapPin, Clock, Send } from "lucide-react";

type Offer = {
  id: string; profile_id: string; level: string | null; city: string | null;
  availability: string | null; note: string | null; author_name: string | null; created_at: string;
  age: number | null; play_type: string | null; gender: string | null; handedness: string | null; surface: string | null;
};

const LEVELS = ["hobby", "začátečník", "mírně pokročilý", "II. třída", "závodní"];
const PLAY: [string, string][] = [["amateur", "amatér"], ["competitive", "závodní"]];
const GENDER: [string, string][] = [["m", "muž"], ["f", "žena"], ["any", "nezáleží"]];
const HAND: [string, string][] = [["right", "pravák"], ["left", "levák"]];
const SURFACE: [string, string][] = [["antuka", "antuka"], ["hala", "hala"], ["tvrdy", "tvrdý"], ["any", "nezáleží"]];
const lbl = (arr: [string, string][], v: string | null) => arr.find((x) => x[0] === v)?.[1] ?? v ?? "";

const empty = { level: "hobby", cityIdx: 0, age: "", play_type: "amateur", gender: "any", handedness: "right", surface: "any", availability: "", note: "" };

export default function SparringClient() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [myOffer, setMyOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [contact, setContact] = useState<Offer | null>(null);
  const [cText, setCText] = useState("");
  const [done, setDone] = useState(false);

  const [fCity, setFCity] = useState(""); const [fLevel, setFLevel] = useState(""); const [fPlay, setFPlay] = useState(""); const [fGender, setFGender] = useState("");

  const loadOffers = async () => {
    const sb = createClient();
    const { data } = await sb.from("sparring_offers").select("*").eq("active", true).order("created_at", { ascending: false });
    setOffers((data as Offer[]) ?? []);
  };

  useEffect(() => {
    const sb = createClient();
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        setUserId(user.id);
        const [{ data: p }, { data: mine }] = await Promise.all([
          sb.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
          sb.from("sparring_offers").select("*").eq("profile_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        ]);
        setAuthorName(p?.full_name ?? "");
        if (mine) {
          const o = mine as Offer;
          setMyOffer(o);
          const ci = CITIES.findIndex((c) => c[0] === o.city);
          setForm({ level: o.level ?? "hobby", cityIdx: ci >= 0 ? ci : 0, age: o.age ? String(o.age) : "", play_type: o.play_type ?? "amateur", gender: o.gender ?? "any", handedness: o.handedness ?? "right", surface: o.surface ?? "any", availability: o.availability ?? "", note: o.note ?? "" });
        }
      }
      await loadOffers();
      setLoading(false);
    })();
  }, []);

  const saveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setBusy(true);
    const sb = createClient();
    const c = CITIES[form.cityIdx];
    const row = {
      profile_id: userId, level: form.level, city: c[0], lat: c[1], lng: c[2],
      age: form.age ? Number(form.age) : null, play_type: form.play_type, gender: form.gender,
      handedness: form.handedness, surface: form.surface, availability: form.availability, note: form.note,
      author_name: authorName || "Hráč", active: true,
    };
    if (myOffer) await sb.from("sparring_offers").update(row).eq("id", myOffer.id);
    else await sb.from("sparring_offers").insert(row);
    setBusy(false); setShowForm(false);
    await loadOffers();
    const { data: mine } = await sb.from("sparring_offers").select("*").eq("profile_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    setMyOffer((mine as Offer) ?? null);
  };

  const unpublish = async () => {
    if (!myOffer) return;
    setBusy(true);
    const sb = createClient();
    await sb.from("sparring_offers").update({ active: false }).eq("id", myOffer.id);
    setBusy(false); setMyOffer(null); await loadOffers();
  };

  const sendContact = async () => {
    if (!userId || !contact || !cText.trim()) return;
    setBusy(true);
    const sb = createClient();
    await sb.from("messages").insert({ from_id: userId, to_id: contact.profile_id, from_name: authorName || "Hráč", to_name: contact.author_name, body: cText.trim() });
    setBusy(false); setDone(true);
  };

  const shown = offers.filter((o) =>
    (!fCity || o.city === fCity) && (!fLevel || o.level === fLevel) &&
    (!fPlay || o.play_type === fPlay) && (!fGender || o.gender === fGender || (fGender !== "any" && o.gender === "any")));

  return (
    <div className="profile-page">
      <header className="subhdr"><div className="wrap"><div className="bar">
        <Link href="/" className="brand"><Wordmark /></Link>
        <Link href="/mapa" className="back">← Zpět na mapu</Link>
      </div></div></header>

      <section className="phero"><div className="wrap"><div className="row">
        <div className="avatar" style={{ background: "linear-gradient(135deg,#f0d9cd,#d8a98f)" }}><Handshake size={44} /></div>
        <div className="who">
          <span className="verif">Sparring partneři</span>
          <h1>Najdi s kým hrát</h1>
          <div className="typ">Parťáci na tenis po celé ČR — podle úrovně, místa i stylu hry</div>
        </div>
      </div></div></section>

      <div className="wrap" style={{ padding: "2rem 0 4rem" }}>
        {/* MOJE SPARRING KARTA */}
        <div className="acct-card" style={{ marginBottom: "1.6rem" }}>
          <div className="acct-card-head"><Handshake size={20} /><h2>Moje sparring karta</h2>
            {myOffer && <span className="member-badge">NA ZDI</span>}
          </div>
          {!userId ? (
            <p className="member-note">Chceš parťáka? <Link href="/prihlaseni?tab=reg" style={{ color: "var(--gold)", fontWeight: 700 }}>Zaregistruj se zdarma</Link> a publikuj svou kartu na zeď.</p>
          ) : !showForm ? (
            <>
              <p className="member-note">{myOffer ? "Tvoje karta je na zdi i na mapě. Můžeš ji upravit nebo stáhnout." : "Vyplň kartu a objevíš se na zdi i jako pin na mapě — ostatní tě osloví."}</p>
              <div className="card-actions">
                <button className="btn btn-gold" onClick={() => setShowForm(true)}>{myOffer ? "Upravit kartu" : "Vytvořit sparring kartu"}</button>
                {myOffer && <button className="btn btn-out" onClick={unpublish} disabled={busy}>Stáhnout ze zdi</button>}
              </div>
            </>
          ) : (
            <form onSubmit={saveCard}>
              <div className="spar-form-grid">
                <div className="fld"><label>Úroveň</label><select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></div>
                <div className="fld"><label>Hraju</label><select value={form.play_type} onChange={(e) => setForm({ ...form, play_type: e.target.value })}>{PLAY.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                <div className="fld"><label>Město</label><select value={form.cityIdx} onChange={(e) => setForm({ ...form, cityIdx: +e.target.value })}>{CITIES.map((c, i) => <option key={c[0]} value={i}>{c[0]}</option>)}</select></div>
                <div className="fld"><label>Věk</label><input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="věk" /></div>
                <div className="fld"><label>Pohlaví</label><select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>{GENDER.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                <div className="fld"><label>Ruka</label><select value={form.handedness} onChange={(e) => setForm({ ...form, handedness: e.target.value })}>{HAND.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                <div className="fld"><label>Povrch</label><select value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })}>{SURFACE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                <div className="fld"><label>Dostupnost</label><input value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} placeholder="večery, víkendy" /></div>
              </div>
              <div className="fld"><label>Pár slov</label><textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Hledám vyrovnaného soupeře na pravidelné hraní…" /></div>
              <div className="card-actions">
                <button className="btn btn-gold" type="submit" disabled={busy}>{busy ? "Ukládám…" : "Publikovat na zeď"}</button>
                <button className="btn btn-out" type="button" onClick={() => setShowForm(false)}>Zrušit</button>
              </div>
            </form>
          )}
        </div>

        {/* FILTRY */}
        <div className="spar-filters">
          <select value={fCity} onChange={(e) => setFCity(e.target.value)}><option value="">Všechna města</option>{CITIES.map((c) => <option key={c[0]}>{c[0]}</option>)}</select>
          <select value={fLevel} onChange={(e) => setFLevel(e.target.value)}><option value="">Každá úroveň</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
          <select value={fPlay} onChange={(e) => setFPlay(e.target.value)}><option value="">Amatér i závodní</option>{PLAY.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <select value={fGender} onChange={(e) => setFGender(e.target.value)}><option value="">Kdokoli</option>{GENDER.filter((g) => g[0] !== "any").map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </div>

        {/* ZEĎ */}
        {loading ? <p className="member-note">Načítám…</p> : shown.length === 0 ? (
          <div className="card"><p className="member-note" style={{ margin: 0 }}>Nic neodpovídá filtru. Zkus jiné, nebo přidej svou kartu.</p></div>
        ) : (
          <div className="spar-grid">
            {shown.map((o) => (
              <div className="spar-card" key={o.id}>
                <div className="spar-top">
                  <span className="spar-level">{o.level || "hobby"}</span>
                  {o.city && <span className="spar-city"><MapPin size={14} /> {o.city}</span>}
                </div>
                <div className="spar-tags">
                  {o.play_type && <span className="spar-tag">{lbl(PLAY, o.play_type)}</span>}
                  {o.age ? <span className="spar-tag">{o.age} let</span> : null}
                  {o.gender && o.gender !== "any" && <span className="spar-tag">{lbl(GENDER, o.gender)}</span>}
                  {o.handedness && <span className="spar-tag">{lbl(HAND, o.handedness)}</span>}
                  {o.surface && o.surface !== "any" && <span className="spar-tag">{lbl(SURFACE, o.surface)}</span>}
                </div>
                <p className="spar-note">{o.note || "Hledám parťáka na tenis."}</p>
                {o.availability && <div className="spar-avail"><Clock size={13} /> {o.availability}</div>}
                <div className="spar-foot">
                  <span className="spar-author">{o.author_name || "Hráč"}</span>
                  {o.profile_id !== userId && (
                    <button className="btn btn-out spar-btn" onClick={() => { if (!userId) { window.location.href = "/prihlaseni"; return; } setContact(o); setCText(`Ahoj, mám zájem o sparring${o.city ? ` v ${o.city}` : ""}. Kdy se ti to hodí?`); setDone(false); }}>Napsat</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KONTAKT */}
      {contact && (
        <div className="ov on" onClick={(e) => e.target === e.currentTarget && setContact(null)}>
          <div className="modal">
            {done ? (
              <div className="success">
                <div className="ok"><Handshake size={28} /></div>
                <h3>Zpráva odeslána</h3>
                <p className="msub" style={{ marginTop: ".4rem" }}>Konverzaci najdeš v sekci <Link href="/zpravy" style={{ color: "var(--gold)", fontWeight: 700 }}>Zprávy</Link>.</p>
                <Link href="/zpravy" className="btn btn-green" style={{ width: "100%" }}>Přejít do zpráv</Link>
                <button className="btn btn-out" style={{ width: "100%", marginTop: ".6rem" }} onClick={() => setContact(null)}>Zavřít</button>
              </div>
            ) : (
              <>
                <button className="x" onClick={() => setContact(null)}>×</button>
                <h3>Napsat — {contact.author_name || "parťák"}</h3>
                <div className="msub">Zpráva dorazí do jeho schránky na TenisHubu.</div>
                <div className="fld"><label>Zpráva</label><textarea rows={3} value={cText} onChange={(e) => setCText(e.target.value)} /></div>
                <button className="btn btn-gold" style={{ width: "100%" }} onClick={sendContact} disabled={busy}><Send size={15} /> {busy ? "Odesílám…" : "Odeslat"}</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
