"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, Mail, Globe, MessageSquare, Lock, ShieldCheck, UserCheck, Flag } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { createClient } from "@/lib/supabase/client";

const DAYS: [string, number][] = [
  ["Po", 9], ["Út", 10], ["St", 11], ["Čt", 12], ["Pá", 13], ["So", 14], ["Ne", 15],
];
const TIMES = ["8:00", "9:00", "16:00", "17:00", "18:00"];
// 1 = volné, 0 = obsazené
const PAT = [
  [1, 0, 1, 1, 0],
  [1, 1, 0, 1, 1],
  [0, 1, 1, 0, 1],
  [1, 0, 1, 1, 1],
  [1, 1, 0, 1, 0],
  [0, 0, 1, 1, 0],
  [0, 0, 0, 0, 0],
];
const PRICE = 500;

const KIND_LABEL: Record<string, string> = {
  coach: "Tenisový trenér", physio: "Fyzioterapeut", fitness: "Fitness trenér", academy: "Akademie",
};

// Reálný specialista z DB (stránka /trener/[id]); bez něj jede demo model.
export type Spec = {
  id: string; kind: string; name: string; bio: string | null; city: string | null;
  phone: string | null; email: string | null; website: string | null;
  price_from: number | null; verified: boolean; rating: number | null; reviews_count: number | null;
  status?: string | null; source?: string | null;
};

type Modal = null | "msg" | "sent" | "book" | "pay" | "done" | "auth" | "member" | "claim" | "claimSent" | "remove" | "removeSent";

export default function TrenerProfile({ spec }: { spec?: Spec }) {
  const [modal, setModal] = useState<Modal>(null);
  const [booked, setBooked] = useState<Set<string>>(new Set());
  const [chosen, setChosen] = useState<{ key: string; txt: string; di: number; ti: number } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [hasMember, setHasMember] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dbReviews, setDbReviews] = useState<{ id: string; author_name: string | null; rating: number; body: string | null }[]>([]);
  const [rStars, setRStars] = useState(5);
  const [rBody, setRBody] = useState("");
  const [rBusy, setRBusy] = useState(false);
  const [rDone, setRDone] = useState(false);
  const [rmEmail, setRmEmail] = useState("");
  const [rmReason, setRmReason] = useState("");
  const [claimBusy, setClaimBusy] = useState(false);

  // přihlášení + členství (rezervace/zprávy = funkce HUB+)
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const [{ data: p }, { data: m }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).single(),
        supabase.from("memberships").select("id").eq("profile_id", user.id)
          .eq("status", "active").gt("expires_at", new Date().toISOString()).limit(1).maybeSingle(),
      ]);
      setUserName(p?.full_name ?? "");
      setHasMember(!!m);
    })();
  }, []);

  // recenze z DB (jen u reálného specialisty)
  const loadReviews = async () => {
    if (!spec) return;
    const supabase = createClient();
    const { data } = await supabase.from("reviews").select("id,author_name,rating,body")
      .eq("specialist_id", spec.id).order("created_at", { ascending: false });
    setDbReviews(data ?? []);
  };
  useEffect(() => { loadReviews(); /* eslint-disable-next-line */ }, [spec?.id]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) { setModal("auth"); return; }
    if (!spec) return;
    setRBusy(true);
    const supabase = createClient();
    await supabase.from("reviews").insert({
      specialist_id: spec.id, author_id: userId, author_name: userName || "Hráč", rating: rStars, body: rBody,
    });
    setRBusy(false); setRBody(""); setRStars(5); setRDone(true);
    setTimeout(() => setRDone(false), 2500);
    await loadReviews();
  };

  const pickSlot = (di: number, ti: number) => {
    const txt = `${DAYS[di][0]} ${DAYS[di][1]}. 6. v ${TIMES[ti]}`;
    setChosen({ key: `${di}-${ti}`, txt, di, ti });
    if (!userId) { setModal("auth"); return; }
    if (!hasMember) { setModal("member"); return; }
    setModal("book");
  };

  const confirmBooking = async (paid: boolean) => {
    if (!chosen || !userId) return;
    setSaving(true);
    const supabase = createClient();
    const [h, min] = TIMES[chosen.ti].split(":").map(Number);
    const starts = new Date(2026, 5, DAYS[chosen.di][1], h, min);
    const ends = new Date(starts.getTime() + 55 * 60000);
    await supabase.from("bookings").insert({
      customer_id: userId,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      price_czk: price,
      specialist_id: spec?.id ?? null,
      status: paid ? "paid" : "pending",
      payment_ref: paid ? "demo-card" : null,
    });
    setSaving(false);
    setBooked((b) => new Set(b).add(chosen.key));
    setModal("done");
  };

  const scrollToCal = () => document.getElementById("week")?.scrollIntoView({ behavior: "smooth" });

  // "Tohle jsem já" — odešle žádost o převzetí (schvaluje admin)
  const submitClaim = async () => {
    if (!userId) { setModal("auth"); return; }
    if (!spec) return;
    setClaimBusy(true);
    const supabase = createClient();
    await supabase.from("claim_requests").insert({ specialist_id: spec.id, user_id: userId });
    setClaimBusy(false);
    setModal("claimSent");
  };

  // opt-out — smí poslat kdokoli (i bez účtu)
  const submitRemoval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spec) return;
    const supabase = createClient();
    await supabase.from("removal_requests").insert({ specialist_id: spec.id, email: rmEmail, reason: rmReason });
    setRmEmail(""); setRmReason("");
    setModal("removeSent");
  };

  // zprávy trenérovi = členská funkce
  const openMsg = () => {
    if (!userId) { setModal("auth"); return; }
    if (!hasMember) { setModal("member"); return; }
    setModal("msg");
  };

  // data z DB, nebo demo model
  const unclaimed = spec?.status === "unclaimed";
  const name = spec?.name ?? "Jiří Novák";
  const firstName = name.replace(/^(Mgr\.|Ing\.|Bc\.|MUDr\.)\s*/i, "").split(" ")[0];
  const initials = name.replace(/^(Mgr\.|Ing\.|Bc\.|MUDr\.)\s*/i, "").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const typLine = spec ? `${KIND_LABEL[spec.kind] ?? "Specialista"}${spec.city ? ` · ${spec.city}` : ""}` : "Tenisový trenér · II. třída · Praha 6";
  const rating = spec?.rating != null ? String(spec.rating).replace(".", ",") : "4,9";
  const reviews = spec?.reviews_count ?? 37;
  const showRate = spec ? reviews > 0 : true;            // u reálných bez recenzí hvězdičky neukazuj
  const verified = spec ? spec.verified : true;
  // u reálných profilů NEVYMÝŠLÍME obsah ani kontakt — jen co je v DB
  const bio = spec ? spec.bio : "Tenisu se věnuji přes 20 let, z toho 12 jako trenér. Specializuji se na děti od 5 let i dospělé hobby hráče — technika úderů, hra a radost z pohybu.";
  const price = spec?.price_from && spec.price_from > 0 ? spec.price_from : PRICE;
  const phone = spec ? spec.phone : "+420 721 028 503";
  const mail = spec ? spec.email : "jiri.novak@email.cz";
  const web = spec ? spec.website : "www.tenisnovak.cz";

  return (
    <div className="profile-page">
      <header className="subhdr">
        <div className="wrap">
          <div className="bar">
            <Link href="/mapa" className="brand"><Wordmark /></Link>
            <Link href="/mapa" className="back">← Zpět na mapu</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="phero">
        <div className="wrap">
          <div className="row">
            <div className="avatar">{initials}</div>
            <div className="who">
              {unclaimed
                ? <span className="verif unverif">Neověřený profil</span>
                : verified && <span className="verif">✓ Ověřený specialista</span>}
              <h1>{name}</h1>
              <div className="typ">{typLine}</div>
              {showRate && (
                <div className="rate">
                  <span className="stars">★★★★★</span> <b>{rating}</b> <span>({reviews} hodnocení)</span>
                </div>
              )}
            </div>
            <div className="acts">
              {unclaimed ? (
                <>
                  <button className="btn btn-gold" onClick={submitClaim} disabled={claimBusy}>
                    <UserCheck size={18} /> Tohle jsem já
                  </button>
                  <button className="btn btn-out" onClick={() => setModal("remove")}>
                    <Flag size={16} /> Nahlásit / odstranit
                  </button>
                </>
              ) : (
                <button className="btn btn-gold" onClick={openMsg}>
                  <MessageSquare size={18} /> Napsat zprávu
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {unclaimed && (
        <div className="wrap">
          <div className="claim-banner">
            <div className="cb-ic"><ShieldCheck size={26} /></div>
            <div className="cb-txt">
              <b>Tento profil zatím není spravovaný.</b>
              <p>Vznikl z veřejně dostupných informací, aby vás hráči našli. Údaje jsme záměrně nedoplňovali —
                doplní si je sám specialista, až profil převezme. Jste to vy? Převezměte si profil a spravujte ho.
                Nechcete tu být? Stačí kliknout na „Nahlásit / odstranit" — profil hned skryjeme.</p>
              <div className="cb-acts">
                <button className="btn btn-gold" onClick={submitClaim} disabled={claimBusy}><UserCheck size={17} /> Tohle jsem já — převzít profil</button>
                <button className="btn btn-out" onClick={() => setModal("remove")}><Flag size={15} /> Nahlásit / odstranit</button>
              </div>
              <Link href="/soukromi" className="cb-link">Jak nakládáme s údaji →</Link>
            </div>
          </div>
        </div>
      )}

      {!unclaimed && (phone || mail || web) && (
        <div className="wrap">
          <div className="contacts">
            {phone && <a href={`tel:${phone.replace(/\s/g, "")}`}><span className="ci"><Phone size={17} /></span> {phone}</a>}
            {mail && <a href={`mailto:${mail}`}><span className="ci"><Mail size={17} /></span> {mail}</a>}
            {web && <a href={web.startsWith("http") ? web : `https://${web}`} target="_blank" rel="noopener noreferrer"><span className="ci"><Globe size={17} /></span> {web}</a>}
          </div>
        </div>
      )}

      {/* BODY */}
      {!unclaimed && (
      <div className="wrap">
        <div className="body">
          <div className="main">
            <div className="card">
              <h2>O mně</h2>
              <p>{bio || "Specialista zatím nedoplnil popis."}</p>
              <div className="tags">
                <span className="tag">Děti od 5 let</span><span className="tag">Dospělí</span>
                <span className="tag">Technika</span><span className="tag">Kondice</span>
                <span className="tag">Čeština / English</span>
              </div>
            </div>

            <div className="card">
              <div className="cal-head">
                <h2 style={{ margin: 0 }}>Volné hodiny</h2>
                <span className="leg"><b>●</b> volné · klikni a rezervuj</span>
              </div>
              <div className="week" id="week">
                {DAYS.map((d, di) => (
                  <div className="day" key={di}>
                    <div className="dh">{d[0]}<b>{d[1]}. 6.</b></div>
                    {TIMES.map((t, ti) => {
                      const key = `${di}-${ti}`;
                      const isBooked = booked.has(key);
                      const free = PAT[di][ti] === 1 && !isBooked;
                      const cls = isBooked ? "slot booked" : free ? "slot" : "slot taken";
                      return (
                        <button
                          key={ti}
                          className={cls}
                          disabled={!free && !isBooked}
                          onClick={() => free && pickSlot(di, ti)}
                        >
                          {isBooked ? "✓" : t}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2>Recenze {spec ? `(${dbReviews.length})` : "(37)"}</h2>

              {!spec ? (
                <>
                  <div className="rev"><div className="ra">PM</div><div><div className="rn">Petra M. <span className="rs">★★★★★</span></div><p>Syn se na tréninky moc těší, Jirka je trpělivý a děti ho zbožňují.</p></div></div>
                  <div className="rev"><div className="ra">TK</div><div><div className="rn">Tomáš K. <span className="rs">★★★★★</span></div><p>Za půl roku se mi výrazně zlepšil servis. Doporučuji.</p></div></div>
                  <div className="rev"><div className="ra">LH</div><div><div className="rn">Lucie H. <span className="rs">★★★★☆</span></div><p>Skvělý přístup, jen občas těžko hledá volný termín — je vytížený.</p></div></div>
                </>
              ) : (
                <>
                  {dbReviews.length === 0 && <p className="member-note" style={{ margin: "0 0 1rem" }}>Zatím bez recenzí. Buď první, kdo ohodnotí!</p>}
                  {dbReviews.map((rv) => {
                    const ini = (rv.author_name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                    return (
                      <div className="rev" key={rv.id}>
                        <div className="ra">{ini}</div>
                        <div><div className="rn">{rv.author_name || "Hráč"} <span className="rs">{"★".repeat(rv.rating)}{"☆".repeat(5 - rv.rating)}</span></div>{rv.body && <p>{rv.body}</p>}</div>
                      </div>
                    );
                  })}

                  <form className="rev-form" onSubmit={submitReview}>
                    <div className="rev-form-head">Napsat recenzi</div>
                    <div className="rev-stars">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button type="button" key={n} className={n <= rStars ? "on" : ""} onClick={() => setRStars(n)} aria-label={`${n} hvězd`}>★</button>
                      ))}
                    </div>
                    <textarea rows={2} value={rBody} onChange={(e) => setRBody(e.target.value)} placeholder="Jak ses cítil/a na lekci?" />
                    <button className="btn btn-green" disabled={rBusy} type="submit">{rBusy ? "Odesílám…" : rDone ? "✓ Děkujeme!" : userId ? "Přidat recenzi" : "Přihlásit se a hodnotit"}</button>
                  </form>
                </>
              )}
            </div>
          </div>

          <aside className="side">
            <div className="bcard">
              <div className="price">{price} Kč <small>/ 55 min</small></div>
              <div style={{ margin: "1rem 0" }}>
                <div className="ln"><span>Individuální lekce</span><span>{price} Kč</span></div>
                <div className="ln"><span>Ve dvojici (za osobu)</span><span>{Math.round(price * 0.6 / 10) * 10} Kč</span></div>
                <div className="ln"><span>Skupina 4 hráči</span><span>{Math.round(price * 0.45 / 10) * 10} Kč</span></div>
              </div>
              <button className="btn btn-gold" style={{ width: "100%" }} onClick={scrollToCal}>Vybrat termín →</button>
              <button className="btn btn-out" style={{ width: "100%", marginTop: ".6rem" }} onClick={openMsg}>Napsat zprávu</button>
              <div className="note">Platba kartou online · zdarma storno 24 h předem</div>
            </div>
          </aside>
        </div>
      </div>
      )}

      {/* MODALS */}
      {modal === "msg" && (
        <div className="ov on" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <button className="x" onClick={() => setModal(null)}>×</button>
            <h3>Napsat — {firstName}</h3>
            <div className="msub">Odpoví vám zpravidla do 24 hodin.</div>
            <div className="fld"><label>Vaše jméno</label><input placeholder="Jméno a příjmení" /></div>
            <div className="fld"><label>Zpráva</label><textarea rows={3} placeholder="Dobrý den, měl bych zájem o lekce pro syna (8 let)…" /></div>
            <button className="btn btn-green" style={{ width: "100%" }} onClick={() => setModal("sent")}>Odeslat zprávu</button>
          </div>
        </div>
      )}

      {modal === "sent" && (
        <div className="ov on" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="success">
              <div className="ok">✓</div>
              <h3>Zpráva odeslána</h3>
              <p className="msub" style={{ marginTop: ".4rem" }}>{firstName} se vám brzy ozve. (Náhled — na ostrém webu zpráva dorazí trenérovi.)</p>
              <button className="btn btn-green" style={{ width: "100%" }} onClick={() => setModal(null)}>Hotovo</button>
            </div>
          </div>
        </div>
      )}

      {modal === "book" && (
        <div className="ov on" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <button className="x" onClick={() => setModal(null)}>×</button>
            <h3>Rezervace lekce</h3>
            <div className="msub">Individuální lekce — {name}</div>
            <div className="summary"><div className="s1">{chosen?.txt ?? "—"}</div><div className="s2">{price} Kč</div></div>
            <button className="btn btn-gold" style={{ width: "100%" }} onClick={() => setModal("pay")}>Zaplatit kartou →</button>
            <button className="btn btn-out" style={{ width: "100%", marginTop: ".6rem" }} onClick={() => confirmBooking(false)} disabled={saving}>{saving ? "Ukládám…" : "Rezervovat, zaplatím na místě"}</button>
          </div>
        </div>
      )}

      {modal === "pay" && (
        <div className="ov on" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <button className="x" onClick={() => setModal(null)}>×</button>
            <h3>Platba kartou</h3>
            <div className="msub">Lekce {chosen?.txt ?? "—"}</div>
            <div className="fld"><label>Číslo karty</label><input placeholder="1234 1234 1234 1234" inputMode="numeric" /></div>
            <div className="frow">
              <div className="fld" style={{ flex: 1 }}><label>Platnost</label><input placeholder="MM / RR" /></div>
              <div className="fld" style={{ flex: 1 }}><label>CVC</label><input placeholder="123" /></div>
            </div>
            <div className="fld"><label>Jméno na kartě</label><input placeholder="Jan Novák" /></div>
            <button className="btn btn-gold" style={{ width: "100%" }} onClick={() => confirmBooking(true)} disabled={saving}>{saving ? "Ukládám…" : `Zaplatit ${price} Kč`}</button>
            <div className="stripe-badge">🔒 Zabezpečeno přes <b>GoPay</b></div>
          </div>
        </div>
      )}

      {modal === "auth" && (
        <div className="ov on" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <button className="x" onClick={() => setModal(null)}>×</button>
            <h3>Nejdřív se přihlas</h3>
            <div className="msub">Rezervace termínu vyžaduje účet (zdarma) a členství HUB+.</div>
            <Link href="/prihlaseni" className="btn btn-gold" style={{ width: "100%" }}>Přihlásit se</Link>
            <Link href="/prihlaseni?tab=reg" className="btn btn-out" style={{ width: "100%", marginTop: ".6rem" }}>Vytvořit účet zdarma</Link>
          </div>
        </div>
      )}

      {modal === "member" && (
        <div className="ov on" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <button className="x" onClick={() => setModal(null)}>×</button>
            <h3><Lock size={18} style={{ verticalAlign: "-2px", color: "var(--gold)" }} /> Funkce HUB+</h3>
            <div className="msub">
              Rezervace a zprávy jsou členská funkce. HUB+ stojí 200 Kč/měsíc, začátek i konec vidíš
              ve svém účtu a prodlužování kdykoli vypneš.
            </div>
            <Link href="/ucet" className="btn btn-gold" style={{ width: "100%" }}>Aktivovat HUB+ v mém účtu</Link>
            <button className="btn btn-out" style={{ width: "100%", marginTop: ".6rem" }} onClick={() => setModal(null)}>Zatím ne</button>
          </div>
        </div>
      )}

      {modal === "claimSent" && (
        <div className="ov on" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="success">
              <div className="ok">✓</div>
              <h3>Žádost odeslána</h3>
              <p className="msub" style={{ marginTop: ".4rem" }}>
                Ozveme se ti na e-mail účtu a po ověření ti profil přiřadíme — pak si ho můžeš celý upravit.
              </p>
              <button className="btn btn-green" style={{ width: "100%" }} onClick={() => setModal(null)}>Hotovo</button>
            </div>
          </div>
        </div>
      )}

      {modal === "remove" && (
        <div className="ov on" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <button className="x" onClick={() => setModal(null)}>×</button>
            <h3><Flag size={17} style={{ verticalAlign: "-2px" }} /> Nahlásit / odstranit profil</h3>
            <div className="msub">
              Nechcete tu být, nebo profil obsahuje chybu? Napište nám a profil obratem skryjeme.
              Účet k tomu nepotřebujete.
            </div>
            <form onSubmit={submitRemoval}>
              <div className="fld"><label>Váš e-mail (pro potvrzení)</label><input type="email" value={rmEmail} onChange={(e) => setRmEmail(e.target.value)} placeholder="vas@email.cz" required /></div>
              <div className="fld"><label>Důvod (nepovinné)</label><textarea rows={2} value={rmReason} onChange={(e) => setRmReason(e.target.value)} placeholder="Nechci být uveden / údaj je špatně…" /></div>
              <button className="btn btn-gold" style={{ width: "100%" }} type="submit">Odeslat žádost</button>
            </form>
          </div>
        </div>
      )}

      {modal === "removeSent" && (
        <div className="ov on" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="success">
              <div className="ok">✓</div>
              <h3>Děkujeme</h3>
              <p className="msub" style={{ marginTop: ".4rem" }}>
                Žádost jsme přijali a profil co nejdříve skryjeme. Na zadaný e-mail vám dáme vědět.
              </p>
              <button className="btn btn-green" style={{ width: "100%" }} onClick={() => setModal(null)}>Zavřít</button>
            </div>
          </div>
        </div>
      )}

      {modal === "done" && (
        <div className="ov on" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="success">
              <div className="ok">✓</div>
              <h3>Rezervováno!</h3>
              <p className="msub" style={{ marginTop: ".4rem" }}>
                Lekce {chosen?.txt} je rezervovaná a uložená ve tvém účtu — najdeš ji v sekci <Link href="/ucet" style={{ color: "var(--gold)", fontWeight: 700 }}>Moje rezervace</Link>. (Platba kartou bude ostrá až s GoPay.)
              </p>
              <button className="btn btn-green" style={{ width: "100%" }} onClick={() => setModal(null)}>Hotovo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
