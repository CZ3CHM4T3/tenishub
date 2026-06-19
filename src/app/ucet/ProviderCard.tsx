"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CITIES } from "@/lib/cities";
import { UserCog, Building2, ImagePlus, Plus, Trash2, ExternalLink, Lock, BadgeCheck, ShieldQuestion } from "lucide-react";

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

const KINDS: [string, string][] = [
  ["coach", "Tenisový trenér"], ["physio", "Fyzioterapeut"],
  ["fitness", "Kondiční trenér"], ["academy", "Tenisová škola / akademie"],
  ["stringer", "Vyplétač (servis raket)"],
];
const WEEKDAYS: [number, string][] = [
  [1, "Pondělí"], [2, "Úterý"], [3, "Středa"], [4, "Čtvrtek"], [5, "Pátek"], [6, "Sobota"], [0, "Neděle"],
];
const pad2 = (n: number) => String(n).padStart(2, "0");
const minToStr = (m: number) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
const strToMin = (s: string) => { const [h, m] = s.split(":").map(Number); return (h || 0) * 60 + (m || 0); };

export default function ProviderCard({ userId, fullName, isMember }: { userId: string; fullName: string; isMember: boolean }) {
  const [loading, setLoading] = useState(true);
  const [spec, setSpec] = useState<Spec | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [avail, setAvail] = useState<Avail[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (m: string) => { setSaved(m); setTimeout(() => setSaved(""), 2500); };

  const load = useCallback(async () => {
    const sb = createClient();
    const [{ data: sp }, { data: ve }] = await Promise.all([
      sb.from("specialists").select("*").eq("owner_id", userId).order("created_at", { ascending: true }).limit(1).maybeSingle(),
      sb.from("venues").select("*").eq("owner_id", userId).order("created_at", { ascending: true }).limit(1).maybeSingle(),
    ]);
    setSpec((sp as Spec) ?? null);
    setVenue((ve as Venue) ?? null);
    if (sp) {
      const sid = (sp as Spec).id;
      const [{ data: svc }, { data: av }] = await Promise.all([
        sb.from("services").select("id,name,price_czk,duration_min").eq("specialist_id", sid),
        sb.from("availability").select("weekday,start_min,end_min,slot_min").eq("specialist_id", sid),
      ]);
      setServices((svc as Service[]) ?? []);
      setAvail(((av as { weekday: number; start_min: number; end_min: number; slot_min: number }[]) ?? [])
        .map((a) => ({ weekday: a.weekday, from: minToStr(a.start_min), to: minToStr(a.end_min), slot: a.slot_min })));
    }
    setLoading(false);
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  const createSpecialist = async (kind: string) => {
    setBusy(true);
    const sb = createClient();
    await sb.from("specialists").insert({ owner_id: userId, kind, name: fullName || "Nový trenér", status: "claimed" });
    await load(); setBusy(false);
  };
  const createVenue = async () => {
    setBusy(true);
    const sb = createClient();
    await sb.from("venues").insert({ owner_id: userId, name: fullName ? `Areál ${fullName}` : "Nový areál", status: "claimed" });
    await load(); setBusy(false);
  };

  const uploadPhoto = async (file: File, target: "spec" | "venue") => {
    setBusy(true);
    const sb = createClient();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${userId}/${target}-${Date.now()}.${ext}`;
    const up = await sb.storage.from("photos").upload(path, file, { upsert: true });
    if (up.error) { setBusy(false); flash("Nahrání fotky selhalo"); return; }
    const url = sb.storage.from("photos").getPublicUrl(path).data.publicUrl;
    if (target === "spec" && spec) { await sb.from("specialists").update({ photo_url: url }).eq("id", spec.id); setSpec({ ...spec, photo_url: url }); }
    if (target === "venue" && venue) { await sb.from("venues").update({ photo_url: url }).eq("id", venue.id); setVenue({ ...venue, photo_url: url }); }
    setBusy(false); flash("Fotka nahrána");
  };

  const saveSpec = async () => {
    if (!spec) return;
    setBusy(true);
    const sb = createClient();
    await sb.from("specialists").update({
      name: spec.name, kind: spec.kind, city: spec.city, bio: spec.bio,
      phone: spec.phone, email: spec.email, website: spec.website, price_from: spec.price_from,
    }).eq("id", spec.id);
    // ceník: smaž a vlož znovu (jednoduché a spolehlivé pro krátký seznam)
    await sb.from("services").delete().eq("specialist_id", spec.id);
    const rows = services.filter((s) => s.name.trim()).map((s) => ({
      specialist_id: spec.id, name: s.name.trim(), price_czk: Number(s.price_czk) || 0, duration_min: Number(s.duration_min) || 55,
    }));
    if (rows.length) await sb.from("services").insert(rows);
    // dostupnost: smaž a vlož znovu
    await sb.from("availability").delete().eq("specialist_id", spec.id);
    const aRows = avail
      .filter((a) => a.from && a.to && strToMin(a.to) > strToMin(a.from))
      .map((a) => ({ specialist_id: spec.id, weekday: a.weekday, start_min: strToMin(a.from), end_min: strToMin(a.to), slot_min: a.slot || 60 }));
    if (aRows.length) await sb.from("availability").insert(aRows);
    setBusy(false); flash("Uloženo ✓");
  };

  const saveVenue = async () => {
    if (!venue) return;
    setBusy(true);
    const sb = createClient();
    await sb.from("venues").update({
      name: venue.name, city: venue.city, description: venue.description,
      website: venue.website, reservation_url: venue.reservation_url,
      amenities: venue.amenities,
    }).eq("id", venue.id);
    setBusy(false); flash("Uloženo ✓");
  };

  const requestVerify = async (table: "specialists" | "venues", id: string) => {
    setBusy(true);
    const sb = createClient();
    await sb.from(table).update({ verify_requested: true }).eq("id", id);
    if (table === "specialists" && spec) setSpec({ ...spec, verify_requested: true });
    if (table === "venues" && venue) setVenue({ ...venue, verify_requested: true });
    setBusy(false); flash("Žádost o ověření odeslána ✓");
  };

  const VerifyBadge = ({ verified, requested }: { verified: boolean | null; requested: boolean | null }) =>
    verified ? <span className="member-badge"><BadgeCheck size={14} style={{ verticalAlign: "-2px" }} /> Ověřeno</span>
      : requested ? <span className="nomember">žádost o ověření odeslána</span>
        : <span className="nomember">neověřeno</span>;

  const LockBar = () => (
    <div className="card-lockbar">
      <Lock size={18} />
      <div><b>Vyplnění karty je součást HUB+</b><span>Být v katalogu a na mapě je zdarma. Fotku, ceník, bio i rezervace odemkne HUB+.</span></div>
      <Link href="/clenstvi" className="btn btn-gold btn-sm">Chci HUB+</Link>
    </div>
  );

  if (loading) return <div className="acct-card"><p className="member-note">Načítám tvou kartu…</p></div>;

  // --- nemá kartu → nabídka vytvoření ---
  if (!spec && !venue) {
    return (
      <div className="acct-card">
        <div className="acct-card-head"><UserCog size={20} /><h2>Moje profilová karta</h2></div>
        <p className="member-note">
          Nabízíš tenisové služby? Vytvoř si veřejnou kartu — objevíš se na mapě i v katalogu,
          hráči tě najdou a ozvou se ti. Být vidět je <b>zdarma</b>.
        </p>
        <div className="card-create">
          {KINDS.map(([k, label]) => (
            <button key={k} className="btn btn-out" disabled={busy} onClick={() => createSpecialist(k)}>{label}</button>
          ))}
          <button className="btn btn-out" disabled={busy} onClick={createVenue}><Building2 size={15} /> Tenisový areál / klub</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {spec && (
        <div className="acct-card">
          <div className="acct-card-head"><UserCog size={20} /><h2>Moje karta specialisty</h2>
            <VerifyBadge verified={spec.verified} requested={spec.verify_requested} />
          </div>
          {!isMember && <LockBar />}
          {isMember && !spec.verified && !spec.verify_requested && (
            <button className="btn btn-out btn-sm card-verify" disabled={busy} onClick={() => requestVerify("specialists", spec.id)}><ShieldQuestion size={15} /> Chci ověření TenisHubem</button>
          )}

          <div className={isMember ? "" : "card-locked"}>
          <div className="card-photo">
            <div className="card-photo-prev" style={spec.photo_url ? { backgroundImage: `url(${spec.photo_url})` } : undefined}>
              {!spec.photo_url && <ImagePlus size={26} />}
            </div>
            <div>
              <button className="btn btn-out" disabled={busy} onClick={() => fileRef.current?.click()}><ImagePlus size={15} /> {spec.photo_url ? "Změnit fotku" : "Nahrát fotku"}</button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0], "spec")} />
              <p className="hint">Čtvercová fotka vypadá nejlíp.</p>
            </div>
          </div>

          <div className="acct-grid">
            <div className="fld"><label>Jméno / název</label><input value={spec.name} onChange={(e) => setSpec({ ...spec, name: e.target.value })} /></div>
            <div className="fld"><label>Typ</label>
              <select value={spec.kind} onChange={(e) => setSpec({ ...spec, kind: e.target.value })}>
                {KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <div className="fld"><label>Město</label>
              <input list="cities-dl" value={spec.city ?? ""} onChange={(e) => setSpec({ ...spec, city: e.target.value })} placeholder="Praha" />
              <datalist id="cities-dl">{CITIES.map((c) => <option key={c[0]} value={c[0]} />)}</datalist>
            </div>
            <div className="fld"><label>Cena od (Kč / lekce)</label><input type="number" value={spec.price_from ?? ""} onChange={(e) => setSpec({ ...spec, price_from: e.target.value ? Number(e.target.value) : null })} placeholder="500" /></div>
            <div className="fld"><label>Telefon</label><input value={spec.phone ?? ""} onChange={(e) => setSpec({ ...spec, phone: e.target.value })} placeholder="+420 …" /></div>
            <div className="fld"><label>E-mail (pro poptávky)</label><input value={spec.email ?? ""} onChange={(e) => setSpec({ ...spec, email: e.target.value })} placeholder="ty@email.cz" /></div>
            <div className="fld"><label>Web</label><input value={spec.website ?? ""} onChange={(e) => setSpec({ ...spec, website: e.target.value })} placeholder="www.tvujweb.cz" /></div>
          </div>
          <div className="fld"><label>O mně (bio)</label><textarea rows={4} value={spec.bio ?? ""} onChange={(e) => setSpec({ ...spec, bio: e.target.value })} placeholder="Čemu se věnuješ, pro koho, zkušenosti…" /></div>

          <div className="cenik">
            <div className="cenik-head"><b>Ceník</b> <span className="hint">jasné ceny = víc poptávek</span></div>
            {services.map((s, i) => (
              <div className="cenik-row" key={i}>
                <input placeholder="Individuální lekce" value={s.name} onChange={(e) => setServices(services.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                <input type="number" placeholder="Kč" value={s.price_czk || ""} onChange={(e) => setServices(services.map((x, j) => j === i ? { ...x, price_czk: Number(e.target.value) } : x))} />
                <input type="number" placeholder="min" value={s.duration_min || ""} onChange={(e) => setServices(services.map((x, j) => j === i ? { ...x, duration_min: Number(e.target.value) } : x))} />
                <button className="cenik-del" onClick={() => setServices(services.filter((_, j) => j !== i))} aria-label="Smazat"><Trash2 size={15} /></button>
              </div>
            ))}
            <button className="btn btn-out cenik-add" onClick={() => setServices([...services, { name: "", price_czk: 0, duration_min: 55 }])}><Plus size={14} /> Přidat položku</button>
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
          </div>{/* /card-locked */}

          <div className="card-actions">
            <button className="btn btn-green" onClick={saveSpec} disabled={busy || !isMember} title={!isMember ? "Vyplnění karty je součást HUB+" : undefined}>{!isMember ? "Uložení s HUB+" : (saved || "Uložit kartu")}</button>
            <Link href={`/trener/${spec.id}`} className="btn btn-out">Zobrazit veřejný profil <ExternalLink size={14} /></Link>
          </div>
        </div>
      )}

      {venue && (
        <div className="acct-card">
          <div className="acct-card-head"><Building2 size={20} /><h2>Můj areál</h2>
            <VerifyBadge verified={venue.verified} requested={venue.verify_requested} />
          </div>
          {!isMember && <LockBar />}
          {isMember && !venue.verified && !venue.verify_requested && (
            <button className="btn btn-out btn-sm card-verify" disabled={busy} onClick={() => requestVerify("venues", venue.id)}><ShieldQuestion size={15} /> Chci ověření TenisHubem</button>
          )}

          <div className={isMember ? "" : "card-locked"}>
          <div className="card-photo">
            <div className="card-photo-prev" style={venue.photo_url ? { backgroundImage: `url(${venue.photo_url})` } : undefined}>
              {!venue.photo_url && <ImagePlus size={26} />}
            </div>
            <div>
              <button className="btn btn-out" disabled={busy} onClick={() => fileRef.current?.click()}><ImagePlus size={15} /> {venue.photo_url ? "Změnit fotku" : "Nahrát fotku"}</button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0], "venue")} />
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
          </div>{/* /card-locked */}

          <div className="card-actions">
            <button className="btn btn-green" onClick={saveVenue} disabled={busy || !isMember} title={!isMember ? "Vyplnění karty je součást HUB+" : undefined}>{!isMember ? "Uložení s HUB+" : (saved || "Uložit areál")}</button>
            <Link href={`/areal/${venue.id}`} className="btn btn-out">Zobrazit veřejný profil <ExternalLink size={14} /></Link>
          </div>
        </div>
      )}
    </>
  );
}
