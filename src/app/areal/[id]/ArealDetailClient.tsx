"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";
import { MapPin, Star, CheckCircle2, ArrowRight, ShieldCheck, UserCheck, Flag, Users } from "lucide-react";

type Venue = {
  id: string; name: string; city: string | null; description: string | null;
  amenities: string[] | null; verified: boolean; rating: number | null; reviews_count: number | null;
  status?: string | null; website?: string | null;
};
type Court = { name: string; indoor: boolean; surface: string | null };
type Trainer = { id: string; name: string; kind: string };

const KIND_LABEL: Record<string, string> = { coach: "Trenér", physio: "Fyzio", fitness: "Kondiční trenér", academy: "Tenisová škola" };

type Modal = null | "claim" | "claimSent" | "remove" | "removeSent";

type Initial = { venue: Venue; courts: Court[]; trainers: Trainer[] };

export default function ArealDetailClient({ id, initial }: { id: string; initial?: Initial }) {
  const [venue, setVenue] = useState<Venue | null>(initial?.venue ?? null);
  const [courts, setCourts] = useState<Court[]>(initial?.courts ?? []);
  const [trainers, setTrainers] = useState<Trainer[]>(initial?.trainers ?? []);
  const [state, setState] = useState<"loading" | "ok" | "missing">(initial ? "ok" : "loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [rmEmail, setRmEmail] = useState("");
  const [rmReason, setRmReason] = useState("");
  const [claimBusy, setClaimBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      // přihlášení potřebujeme vždy (kvůli claim tlačítkům)
      const { data: u } = await supabase.auth.getUser();
      setUserId(u.user?.id ?? null);
      // data o areálu máme buď ze serveru (SSR), nebo je dotáhneme klientsky
      if (initial) return;
      const [v, c, t] = await Promise.all([
        supabase.from("venues").select("*").eq("id", id).maybeSingle(),
        supabase.from("courts").select("name,indoor,surface").eq("venue_id", id),
        supabase.from("specialists").select("id,name,kind").eq("venue_id", id).neq("status", "hidden"),
      ]);
      if (v.data) {
        setVenue(v.data as Venue);
        setCourts((c.data as Court[]) ?? []);
        setTrainers((t.data as Trainer[]) ?? []);
        setState("ok");
      } else setState("missing");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const submitClaim = async () => {
    if (!userId) { window.location.href = "/prihlaseni"; return; }
    if (!venue) return;
    setClaimBusy(true);
    const supabase = createClient();
    await supabase.from("claim_requests").insert({ venue_id: venue.id, user_id: userId });
    setClaimBusy(false);
    setModal("claimSent");
  };

  const submitRemoval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venue) return;
    const supabase = createClient();
    await supabase.from("removal_requests").insert({ venue_id: venue.id, email: rmEmail, reason: rmReason });
    setRmEmail(""); setRmReason("");
    setModal("removeSent");
  };

  if (state === "loading") return <div className="acct-loading">Načítám areál…</div>;
  if (state === "missing" || !venue) return (
    <div className="acct-loading" style={{ flexDirection: "column", display: "flex", gap: "1rem" }}>
      <p>Tenhle areál jsme nenašli.</p>
      <Link href="/mapa" className="btn btn-gold">Zpět na mapu</Link>
    </div>
  );

  const unclaimed = venue.status === "unclaimed";
  const reviews = venue.reviews_count ?? 0;
  const showRate = !unclaimed && reviews > 0;
  const web = venue.website;

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

      <section className="phero">
        <div className="wrap">
          <div className="row">
            <div className="avatar">{venue.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</div>
            <div className="who">
              {venue.verified
                ? <span className="verif">✓ Ověřeno TenisHubem</span>
                : <span className="verif unverif">Čeká na ověření</span>}
              <h1>{venue.name}</h1>
              <div className="typ">Tenisový areál{venue.city ? ` · ${venue.city}` : ""}</div>
              {showRate && (
                <div className="rate">
                  <span className="stars">★★★★★</span> <b>{String(venue.rating ?? "—").replace(".", ",")}</b> <span>({reviews} hodnocení)</span>
                </div>
              )}
            </div>
            <div className="acts">
              {unclaimed && (
                <>
                  <button className="btn btn-gold" onClick={submitClaim} disabled={claimBusy}><UserCheck size={18} /> Spravujeme tento areál</button>
                  <button className="btn btn-out" onClick={() => setModal("remove")}><Flag size={16} /> Nahlásit / odstranit</button>
                </>
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
              <b>Tento areál zatím není spravovaný na TenisHubu.</b>
              <p>Profil vznikl z veřejně dostupných informací, aby vás hráči našli. Jste z vedení klubu?
                Převezměte si profil a doplňte kurty, ceník, otevírací dobu a rezervace. Nechcete tu být?
                Klikněte na „Nahlásit / odstranit" a profil hned skryjeme.</p>
              <Link href="/soukromi" className="cb-link">Jak nakládáme s údaji →</Link>
            </div>
          </div>
        </div>
      )}

      <div className="wrap">
        <div className="body">
          <div className="main">
            <div className="card">
              <h2>O areálu</h2>
              <p>{venue.description || (unclaimed ? "Profil zatím není doplněný — informace doplní klub po převzetí." : "Tenisový areál s kurty pro veřejnost.")}</p>
              {web && <p style={{ marginTop: ".4rem" }}><a href={web.startsWith("http") ? web : `https://${web}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold-l)", fontWeight: 600 }}>{web}</a></p>}
              {Array.isArray(venue.amenities) && venue.amenities.length > 0 && (
                <div className="tags">
                  {venue.amenities.map((a) => <span className="tag" key={a}>{a}</span>)}
                </div>
              )}
            </div>

            {trainers.length > 0 && (
              <div className="card">
                <h2><Users size={20} style={{ verticalAlign: "-3px" }} /> Trenéři a tým ({trainers.length})</h2>
                <div className="member-rows">
                  {trainers.map((t) => (
                    <Link className="mrow trainer-row" href={`/trener/${t.id}`} key={t.id}>
                      <span>{t.name}</span>
                      <b>{KIND_LABEL[t.kind] ?? "Specialista"} <ArrowRight size={14} style={{ verticalAlign: "-2px" }} /></b>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="card">
              <h2>Kurty {courts.length > 0 ? `(${courts.length})` : ""}</h2>
              {courts.length > 0 ? (
                <div className="member-rows">
                  {courts.map((c) => (
                    <div className="mrow" key={c.name}>
                      <span>{c.name}</span>
                      <b>{c.indoor ? "krytý" : "venkovní"}{c.surface ? ` · ${c.surface}` : ""}</b>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--muted)", fontSize: ".92rem" }}>Detail kurtů areál zatím nedoplnil.</p>
              )}
            </div>
          </div>

          <aside className="side">
            <div className="bcard">
              <div style={{ display: "flex", alignItems: "center", gap: ".5rem", color: "var(--green-2)", marginBottom: ".8rem" }}>
                <MapPin size={18} /> <b style={{ color: "var(--green-d)" }}>{venue.city ?? "ČR"}</b>
              </div>
              {showRate && (
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem", color: "var(--green-2)", marginBottom: "1rem" }}>
                  <Star size={18} /> <span style={{ fontSize: ".9rem" }}>Hodnocení {String(venue.rating ?? "—").replace(".", ",")} / 5</span>
                </div>
              )}
              <Link href="/areal" className="btn btn-gold" style={{ width: "100%" }}>
                Rezervovat kurt <ArrowRight size={16} />
              </Link>
              <div className="note"><CheckCircle2 size={13} style={{ verticalAlign: "-2px" }} /> Online rezervace a platby jsou funkce HUB+</div>
            </div>
          </aside>
        </div>
      </div>

      {modal === "claimSent" && (
        <div className="ov on" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal"><div className="success">
            <div className="ok">✓</div>
            <h3>Žádost odeslána</h3>
            <p className="msub" style={{ marginTop: ".4rem" }}>Po ověření vám areál přiřadíme a budete ho moct celý spravovat.</p>
            <button className="btn btn-green" style={{ width: "100%" }} onClick={() => setModal(null)}>Hotovo</button>
          </div></div>
        </div>
      )}

      {modal === "remove" && (
        <div className="ov on" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <button className="x" onClick={() => setModal(null)}>×</button>
            <h3><Flag size={17} style={{ verticalAlign: "-2px" }} /> Nahlásit / odstranit areál</h3>
            <div className="msub">Nechcete tu být, nebo je v profilu chyba? Napište nám a profil obratem skryjeme. Účet nepotřebujete.</div>
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
          <div className="modal"><div className="success">
            <div className="ok">✓</div>
            <h3>Děkujeme</h3>
            <p className="msub" style={{ marginTop: ".4rem" }}>Žádost jsme přijali a profil co nejdříve skryjeme.</p>
            <button className="btn btn-green" style={{ width: "100%" }} onClick={() => setModal(null)}>Zavřít</button>
          </div></div>
        </div>
      )}
    </div>
  );
}
