"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";
import { CITIES } from "@/lib/cities";
import { Handshake, MapPin, Plus, Lock, Clock } from "lucide-react";

type Offer = { id: string; level: string | null; city: string | null; availability: string | null; note: string | null; author_name: string | null; created_at: string };
const LEVELS = ["hobby", "začátečník", "mírně pokročilý", "II. třída", "závodní"];

export default function SparringClient() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [hasMember, setHasMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "create" | "auth" | "member" | "contact">(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ level: "hobby", cityIdx: 0, availability: "", note: "" });

  const loadOffers = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("sparring_offers").select("id,level,city,availability,note,author_name,created_at")
      .eq("active", true).order("created_at", { ascending: false });
    setOffers((data as Offer[]) ?? []);
  };

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const [{ data: p }, { data: m }] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("id", user.id).single(),
          supabase.from("memberships").select("id").eq("profile_id", user.id).eq("status", "active").gt("expires_at", new Date().toISOString()).limit(1).maybeSingle(),
        ]);
        setAuthorName(p?.full_name ?? "");
        setHasMember(!!m);
      }
      await loadOffers();
      setLoading(false);
    })();
  }, []);

  const gate = (cb: () => void) => {
    if (!userId) { setModal("auth"); return; }
    if (!hasMember) { setModal("member"); return; }
    cb();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setBusy(true);
    const supabase = createClient();
    const city = CITIES[form.cityIdx];
    await supabase.from("sparring_offers").insert({
      profile_id: userId, level: form.level, city: city[0], lat: city[1], lng: city[2],
      availability: form.availability, note: form.note, author_name: authorName || "Hráč", active: true,
    });
    setBusy(false);
    setModal(null);
    setForm({ level: "hobby", cityIdx: 0, availability: "", note: "" });
    await loadOffers();
  };

  return (
    <div className="profile-page">
      <header className="subhdr">
        <div className="wrap">
          <div className="bar">
            <Link href="/" className="brand"><Wordmark /></Link>
            <Link href="/mapa" className="back">← Zpět na mapu</Link>
          </div>
        </div>
      </header>

      <section className="phero">
        <div className="wrap">
          <div className="row">
            <div className="avatar" style={{ background: "linear-gradient(135deg,#f0d9cd,#d8a98f)" }}><Handshake size={44} /></div>
            <div className="who">
              <span className="verif">Sparring partneři</span>
              <h1>Najdi s kým hrát</h1>
              <div className="typ">Parťáci na tenis po celé ČR — podle úrovně i místa</div>
            </div>
            <div className="acts">
              <button className="btn btn-gold" onClick={() => gate(() => setModal("create"))}>
                <Plus size={18} /> Přidat inzerát
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap" style={{ padding: "2.4rem 0 4rem" }}>
        {loading ? (
          <p className="member-note">Načítám inzeráty…</p>
        ) : offers.length === 0 ? (
          <div className="card"><p className="member-note" style={{ margin: 0 }}>Zatím tu nejsou žádné nabídky. Buď první — přidej svůj inzerát!</p></div>
        ) : (
          <div className="spar-grid">
            {offers.map((o) => (
              <div className="spar-card" key={o.id}>
                <div className="spar-top">
                  <span className="spar-level">{o.level || "hobby"}</span>
                  {o.city && <span className="spar-city"><MapPin size={14} /> {o.city}</span>}
                </div>
                <p className="spar-note">{o.note || "Hledám parťáka na tenis."}</p>
                {o.availability && <div className="spar-avail"><Clock size={13} /> {o.availability}</div>}
                <div className="spar-foot">
                  <span className="spar-author">{o.author_name || "Hráč"}</span>
                  <button className="btn btn-out spar-btn" onClick={() => gate(() => setModal("contact"))}>Mám zájem</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE */}
      {modal === "create" && (
        <div className="ov on" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <button className="x" onClick={() => setModal(null)}>×</button>
            <h3>Nový sparring inzerát</h3>
            <div className="msub">Ostatní tě najdou podle úrovně a místa.</div>
            <form onSubmit={submit}>
              <div className="frow">
                <div className="fld" style={{ flex: 1 }}><label>Úroveň</label>
                  <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="fld" style={{ flex: 1 }}><label>Město</label>
                  <select value={form.cityIdx} onChange={(e) => setForm({ ...form, cityIdx: +e.target.value })}>
                    {CITIES.map((c, i) => <option key={c[0]} value={i}>{c[0]}</option>)}
                  </select>
                </div>
              </div>
              <div className="fld"><label>Dostupnost</label>
                <input value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} placeholder="např. večery a víkendy" />
              </div>
              <div className="fld"><label>Pár slov</label>
                <textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Hledám vyrovnaného soupeře na pravidelné hraní…" />
              </div>
              <button className="btn btn-gold" style={{ width: "100%" }} disabled={busy} type="submit">{busy ? "Ukládám…" : "Zveřejnit inzerát"}</button>
            </form>
          </div>
        </div>
      )}

      {/* AUTH */}
      {modal === "auth" && (
        <div className="ov on" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <button className="x" onClick={() => setModal(null)}>×</button>
            <h3>Nejdřív se přihlas</h3>
            <div className="msub">Vlastní inzerát a kontakt parťáka jsou pro přihlášené členy.</div>
            <Link href="/prihlaseni" className="btn btn-gold" style={{ width: "100%" }}>Přihlásit se</Link>
            <Link href="/prihlaseni?tab=reg" className="btn btn-out" style={{ width: "100%", marginTop: ".6rem" }}>Vytvořit účet zdarma</Link>
          </div>
        </div>
      )}

      {/* MEMBER */}
      {modal === "member" && (
        <div className="ov on" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <button className="x" onClick={() => setModal(null)}>×</button>
            <h3><Lock size={18} style={{ verticalAlign: "-2px", color: "var(--gold)" }} /> Funkce HUB+</h3>
            <div className="msub">Inzerát i kontakt parťáka jsou členská funkce (200 Kč/měsíc, kdykoli zrušíš).</div>
            <Link href="/ucet" className="btn btn-gold" style={{ width: "100%" }}>Aktivovat HUB+</Link>
            <button className="btn btn-out" style={{ width: "100%", marginTop: ".6rem" }} onClick={() => setModal(null)}>Zatím ne</button>
          </div>
        </div>
      )}

      {/* CONTACT */}
      {modal === "contact" && (
        <div className="ov on" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="success">
              <div className="ok"><Handshake size={28} /></div>
              <h3>Zájem odeslán</h3>
              <p className="msub" style={{ marginTop: ".4rem" }}>Dali jsme parťákovi vědět. (Náhled — na ostrém webu se propojíte přes zprávy.)</p>
              <button className="btn btn-green" style={{ width: "100%" }} onClick={() => setModal(null)}>Hotovo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
