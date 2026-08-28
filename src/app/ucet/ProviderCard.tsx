"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CITIES } from "@/lib/cities";
import { UserCog, Building2, ImagePlus, Plus, Trash2, ExternalLink, BadgeCheck } from "lucide-react";

type Spec = {
  id: string; kind: string; name: string; bio: string | null; city: string | null;
  phone: string | null; email: string | null; website: string | null;
  price_from: number | null; photo_url: string | null; status: string | null;
  verified: boolean | null; verify_requested: boolean | null;
};
type Venue = {
  id: string; name: string; city: string | null; description: string | null;
  website: string | null; reservation_url: string | null; amenities: string[] | null;
  photo_url: string | null; status: string | null;
  verified: boolean | null; verify_requested: boolean | null;
};
type Service = { id?: string; name: string; price_czk: number; duration_min: number };
type Avail = { weekday: number; from: string; to: string; slot: number };

// Role → typ karty. Trenér = coach; ostatní obory mají svůj kind; areál = venue.
const ROLE_KIND: Record<string, string> = { trener: "coach", vyplet: "stringer", fyzio: "physio", fitness: "fitness" };
const ROLE_LABEL: Record<string, string> = { trener: "Trenér", vyplet: "Vyplétač", fyzio: "Fyzioterapeut", fitness: "Fitness trenér", areal: "Areál / klub" };
const PROV_ORDER = ["trener", "vyplet", "fyzio", "fitness", "areal"];

const WEEKDAYS: [number, string][] = [
  [1, "Pondělí"], [2, "Úterý"], [3, "Středa"], [4, "Čtvrtek"], [5, "Pátek"], [6, "Sobota"], [0, "Neděle"],
];
const pad2 = (n: number) => String(n).padStart(2, "0");
const minToStr = (m: number) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
const strToMin = (s: string) => { const [h, m] = s.split(":").map(Number); return (h || 0) * 60 + (m || 0); };

type Identity = { fullName: string; city: string; phone: string; email: string | null; photoUrl: string | null };

export default function ProviderCard({ userId, identity, roles }: { userId: string; identity: Identity; roles: string[] }) {
  const tabs = PROV_ORDER.filter((r) => roles.includes(r)); // záložky = zapnuté poskytovatelské role
  const [loading, setLoading] = useState(true);
  const [specsByKind, setSpecsByKind] = useState<Record<string, Spec>>({});
  const [venue, setVenue] = useState<Venue | null>(null);
  const [activeKey, setActiveKey] = useState<string>(tabs[0] ?? "");
  const [spec, setSpec] = useState<Spec | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [avail, setAvail] = useState<Avail[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (m: string) => { setSaved(m); setTimeout(() => setSaved(""), 2500); };

  const load = useCallback(async () => {
    const sb = createClient();
    const [{ data: sps }, { data: ve }] = await Promise.all([
      sb.from("specialists").select("*").eq("owner_id", userId).order("created_at", { ascending: true }),
      sb.from("venues").select("*").eq("owner_id", userId).order("created_at", { ascending: true }).limit(1).maybeSingle(),
    ]);
    const map: Record<string, Spec> = {};
    ((sps as Spec[]) ?? []).forEach((s) => { if (!map[s.kind]) map[s.kind] = s; });
    setSpecsByKind(map);
    setVenue((ve as Venue) ?? null);
    setLoading(false);
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  // Aktivní záložka vždy platná vůči zapnutým rolím.
  useEffect(() => { if (!tabs.includes(activeKey)) setActiveKey(tabs[0] ?? ""); }, [roles]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSpecExtras = useCallback(async (specId: string) => {
    const sb = createClient();
    const [{ data: svc }, { data: av }] = await Promise.all([
      sb.from("services").select("id,name,price_czk,duration_min").eq("specialist_id", specId),
      sb.from("availability").select("weekday,start_min,end_min,slot_min").eq("specialist_id", specId),
    ]);
    setServices((svc as Service[]) ?? []);
    setAvail(((av as { weekday: number; start_min: number; end_min: number; slot_min: number }[]) ?? [])
      .map((a) => ({ weekday: a.weekday, from: minToStr(a.start_min), to: minToStr(a.end_min), slot: a.slot_min })));
  }, []);

  // Přepnutí záložky → nastav aktivní kartu specialisty + načti její ceník/dostupnost.
  useEffect(() => {
    if (loading || !activeKey || activeKey === "areal") { setSpec(null); return; }
    const kind = ROLE_KIND[activeKey];
    const sp = specsByKind[kind] ?? null;
    setSpec(sp);
    if (sp) loadSpecExtras(sp.id); else { setServices([]); setAvail([]); }
  }, [activeKey, specsByKind, loading, loadSpecExtras]);

  const createSpecialist = async (role: string) => {
    setBusy(true);
    const sb = createClient();
    await sb.from("specialists").insert({
      owner_id: userId, kind: ROLE_KIND[role], status: "claimed",
      name: identity.fullName || ROLE_LABEL[role], city: identity.city || null,
      phone: identity.phone || null, email: identity.email, photo_url: identity.photoUrl,
    });
    await load(); setBusy(false);
  };
  const createVenue = async () => {
    setBusy(true);
    const sb = createClient();
    await sb.from("venues").insert({ owner_id: userId, name: identity.fullName ? `Areál ${identity.fullName}` : "Nový areál", city: identity.city || null, status: "claimed" });
    await load(); setBusy(false);
  };

  const uploadVenuePhoto = async (file: File) => {
    if (!venue) return;
    setBusy(true);
    const sb = createClient();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${userId}/venue-${Date.now()}.${ext}`;
    const up = await sb.storage.from("photos").upload(path, file, { upsert: true });
    if (up.error) { setBusy(false); flash("Nahrání fotky selhalo"); return; }
    const url = sb.storage.from("photos").getPublicUrl(path).data.publicUrl;
    await sb.from("venues").update({ photo_url: url }).eq("id", venue.id);
    setVenue({ ...venue, photo_url: url });
    setBusy(false); flash("Fotka nahrána");
  };

  const saveSpec = async () => {
    if (!spec) return;
    setBusy(true);
    const sb = createClient();
    await sb.from("specialists").update({ bio: spec.bio, website: spec.website, price_from: spec.price_from }).eq("id", spec.id);
    await sb.from("services").delete().eq("specialist_id", spec.id);
    const rows = services.filter((s) => s.name.trim()).map((s) => ({
      specialist_id: spec.id, name: s.name.trim(), price_czk: Number(s.price_czk) || 0, duration_min: s.duration_min ? Number(s.duration_min) : null,
    }));
    if (rows.length) await sb.from("services").insert(rows);
    await sb.from("availability").delete().eq("specialist_id", spec.id);
    const aRows = avail
      .filter((a) => a.from && a.to && strToMin(a.to) > strToMin(a.from))
      .map((a) => ({ specialist_id: spec.id, weekday: a.weekday, start_min: strToMin(a.from), end_min: strToMin(a.to), slot_min: a.slot || 60 }));
    if (aRows.length) await sb.from("availability").insert(aRows);
    setSpecsByKind((m) => ({ ...m, [spec.kind]: spec }));
    setBusy(false); flash("Uloženo ✓");
  };

  const saveVenue = async () => {
    if (!venue) return;
    setBusy(true);
    const sb = createClient();
    await sb.from("venues").update({
      name: venue.name, city: venue.city, description: venue.description,
      website: venue.website, reservation_url: venue.reservation_url, amenities: venue.amenities,
    }).eq("id", venue.id);
    setBusy(false); flash("Uloženo ✓");
  };

  const VerifyBadge = ({ verified }: { verified: boolean | null }) =>
    verified ? <span className="member-badge"><BadgeCheck size={14} style={{ verticalAlign: "-2px" }} /> Ověřeno</span>
      : <span className="nomember">neověřeno</span>;

  if (tabs.length === 0) return null;
  if (loading) return <div className="acct-card"><p className="member-note">Načítám tvou kartu…</p></div>;

  return (
    <div className="acct-card">
      <div className="acct-card-head"><UserCog size={20} /><h2>Veřejná karta</h2></div>
      <p className="member-note">Tvůj veřejný profil pro klienty — objevíš se na mapě i v katalogu. Jméno, město, telefon a fotka se berou z <b>Osobních údajů</b> výše.{tabs.length > 1 ? " Máš víc rolí → přepínej je záložkami níž." : ""}</p>

      {/* ZÁLOŽKY ROLÍ (jen když je jich víc) */}
      {tabs.length > 1 && (
        <div className="acct-tabs" style={{ marginBottom: "1rem" }}>
          {tabs.map((k) => (
            <button key={k} type="button" className={`acct-tab${activeKey === k ? " on" : ""}`} onClick={() => setActiveKey(k)}>
              {k === "areal" ? <Building2 size={16} /> : <UserCog size={16} />} {ROLE_LABEL[k]}
            </button>
          ))}
        </div>
      )}

      {/* ── AREÁL ── */}
      {activeKey === "areal" ? (
        venue ? (<>
          <div className="acct-card-head" style={{ marginTop: 0 }}><Building2 size={18} /><h2 style={{ fontSize: "1.05rem" }}>Areál / klub</h2><VerifyBadge verified={venue.verified} /></div>
          <div className="card-photo">
            <div className="card-photo-prev" style={venue.photo_url ? { backgroundImage: `url(${venue.photo_url})` } : undefined}>
              {!venue.photo_url && <ImagePlus size={26} />}
            </div>
            <div>
              <button className="btn btn-out" disabled={busy} onClick={() => fileRef.current?.click()}><ImagePlus size={15} /> {venue.photo_url ? "Změnit fotku" : "Nahrát fotku"}</button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadVenuePhoto(e.target.files[0])} />
            </div>
          </div>
          <div className="acct-grid">
            <div className="fld"><label>Název areálu</label><input value={venue.name} onChange={(e) => setVenue({ ...venue, name: e.target.value })} /></div>
            <div className="fld"><label>Město</label>
              <input list="cities-dl2" value={venue.city ?? ""} onChange={(e) => setVenue({ ...venue, city: e.target.value })} placeholder="Praha" />
              <datalist id="cities-dl2">{CITIES.map((c) => <option key={c[0]} value={c[0]} />)}</datalist>
            </div>
            <div className="fld"><label>Web</label><input value={venue.website ?? ""} onChange={(e) => setVenue({ ...venue, website: e.target.value })} placeholder="www.areal.cz" /></div>
            <div className="fld"><label>Odkaz na rezervační systém</label><input value={venue.reservation_url ?? ""} onChange={(e) => setVenue({ ...venue, reservation_url: e.target.value })} placeholder="https://rezervace…" /></div>
          </div>
          <div className="fld"><label>Popis</label><textarea rows={4} value={venue.description ?? ""} onChange={(e) => setVenue({ ...venue, description: e.target.value })} placeholder="Počet kurtů, povrch, hala, zázemí…" /></div>
          <div className="fld"><label>Vybavení (oddělené čárkou)</label><input value={(venue.amenities ?? []).join(", ")} onChange={(e) => setVenue({ ...venue, amenities: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} placeholder="antuka, hala, šatny, bistro" /></div>
          <div className="card-actions">
            <button className="btn btn-green" onClick={saveVenue} disabled={busy}>{saved || "Uložit areál"}</button>
            <Link href={`/areal/${venue.id}`} className="btn btn-out">Zobrazit veřejný profil <ExternalLink size={14} /></Link>
          </div>
        </>) : (
          <div className="card-create">
            <p className="member-note">Zatím nemáš kartu areálu. Vytvoř ji a objevíš se na mapě klubů.</p>
            <button className="btn btn-green" disabled={busy} onClick={createVenue}><Building2 size={15} /> Vytvořit kartu areálu</button>
          </div>
        )
      ) : (
        /* ── SPECIALISTA (trenér/vyplétač/fyzio/fitness) ── */
        spec ? (<>
          <div className="acct-card-head" style={{ marginTop: 0 }}><UserCog size={18} /><h2 style={{ fontSize: "1.05rem" }}>{ROLE_LABEL[activeKey]}</h2><VerifyBadge verified={spec.verified} /></div>
          <div className="card-identity">
            <div className="card-photo-prev sm" style={identity.photoUrl ? { backgroundImage: `url(${identity.photoUrl})` } : undefined}>
              {!identity.photoUrl && <UserCog size={22} />}
            </div>
            <div className="card-identity-txt">
              <b>{identity.fullName || "Bez jména"}</b>
              <span>{[identity.city || "město neuvedeno", identity.phone].filter(Boolean).join(" · ")}</span>
              <p className="hint">Jméno, město, telefon i fotka jsou z <b>Osobních údajů</b> — uprav je jednou tam.</p>
            </div>
          </div>
          <div className="acct-grid">
            <div className="fld"><label>Cena od (Kč / lekce)</label><input type="number" value={spec.price_from ?? ""} onChange={(e) => setSpec({ ...spec, price_from: e.target.value ? Number(e.target.value) : null })} placeholder="500" /></div>
            <div className="fld"><label>Web</label><input value={spec.website ?? ""} onChange={(e) => setSpec({ ...spec, website: e.target.value })} placeholder="www.tvujweb.cz" /></div>
          </div>
          <div className="fld"><label>O mně (bio)</label><textarea rows={4} value={spec.bio ?? ""} onChange={(e) => setSpec({ ...spec, bio: e.target.value })} placeholder="Čemu se věnuješ, pro koho, zkušenosti…" /></div>

          <div className="cenik">
            <div className="cenik-head"><b>Ceník — jednotlivé služby</b> <span className="hint">konkrétní položky a jejich cena</span></div>
            {services.map((s, i) => (
              <div className="cenik-row2" key={i}>
                <input placeholder="Např. Individuální lekce 60 min" value={s.name} onChange={(e) => setServices(services.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                <input type="number" placeholder="Kč" value={s.price_czk || ""} onChange={(e) => setServices(services.map((x, j) => j === i ? { ...x, price_czk: Number(e.target.value) } : x))} />
                <button className="cenik-del" onClick={() => setServices(services.filter((_, j) => j !== i))} aria-label="Smazat"><Trash2 size={15} /></button>
              </div>
            ))}
            <button className="btn btn-out cenik-add" onClick={() => setServices([...services, { name: "", price_czk: 0, duration_min: 0 }])}><Plus size={14} /> Přidat položku</button>
          </div>

          <div className="cenik">
            <div className="cenik-head"><b>Dostupnost (kalendář rezervací)</b> <span className="hint">kdy tě jde rezervovat — opakuje se každý týden</span></div>
            {avail.map((a, i) => (
              <div className="avail-row" key={i}>
                <select value={a.weekday} onChange={(e) => setAvail(avail.map((x, j) => j === i ? { ...x, weekday: Number(e.target.value) } : x))}>
                  {WEEKDAYS.map(([w, l]) => <option key={w} value={w}>{l}</option>)}
                </select>
                <input type="time" value={a.from} onChange={(e) => setAvail(avail.map((x, j) => j === i ? { ...x, from: e.target.value } : x))} />
                <span className="avail-dash">–</span>
                <input type="time" value={a.to} onChange={(e) => setAvail(avail.map((x, j) => j === i ? { ...x, to: e.target.value } : x))} />
                <select value={a.slot} onChange={(e) => setAvail(avail.map((x, j) => j === i ? { ...x, slot: Number(e.target.value) } : x))}>
                  {[30, 45, 60, 90].map((s) => <option key={s} value={s}>{s} min</option>)}
                </select>
                <button className="cenik-del" onClick={() => setAvail(avail.filter((_, j) => j !== i))} aria-label="Smazat"><Trash2 size={15} /></button>
              </div>
            ))}
            <button className="btn btn-out cenik-add" onClick={() => setAvail([...avail, { weekday: 1, from: "16:00", to: "20:00", slot: 60 }])}><Plus size={14} /> Přidat čas</button>
          </div>

          <div className="card-actions">
            <button className="btn btn-green" onClick={saveSpec} disabled={busy}>{saved || "Uložit kartu"}</button>
            <Link href={`/trener/${spec.id}`} className="btn btn-out">Zobrazit veřejný profil <ExternalLink size={14} /></Link>
          </div>
        </>) : (
          <div className="card-create">
            <p className="member-note">Zatím nemáš kartu pro roli <b>{ROLE_LABEL[activeKey]}</b>. Vytvoř ji a objevíš se na mapě i v katalogu.</p>
            <button className="btn btn-green" disabled={busy} onClick={() => createSpecialist(activeKey)}><UserCog size={15} /> Vytvořit kartu ({ROLE_LABEL[activeKey]})</button>
          </div>
        )
      )}
    </div>
  );
}
