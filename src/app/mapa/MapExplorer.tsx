"use client";

import { useEffect, useRef, useState } from "react";
import type * as LType from "leaflet";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { CITIES } from "@/lib/cities";
import "leaflet/dist/leaflet.css";

type TypeKey = "coach" | "club" | "fitness" | "physio" | "academy" | "buddy" | "stringer";

const ICONS: Record<TypeKey, string> = {
  coach: '<circle cx="12" cy="8" r="3.2"/><path d="M6 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/>',
  club: '<path d="M5 20V9l7-4 7 4v11"/><path d="M5 20h14"/><path d="M10 20v-5h4v5"/>',
  fitness: '<path d="M7 8v8M4.5 10v4M17 8v8M19.5 10v4M7 12h10"/>',
  physio: '<path d="M3 12h4l2 5 4-12 2 7h6"/>',
  academy: '<path d="M12 5 3 9l9 4 9-4-9-4z"/><path d="M6.5 11v4c0 1.2 2.6 2.2 5.5 2.2s5.5-1 5.5-2.2v-4"/>',
  buddy: '<circle cx="8" cy="9" r="2.3"/><circle cx="16" cy="9" r="2.3"/><path d="M3.5 18c0-2.1 1.7-3.4 4.5-3.4M20.5 18c0-2.1-1.7-3.4-4.5-3.4M9 18c0-1.9 1.3-3 3-3s3 1.1 3 3"/>',
  stringer: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 4v16M15 4v16M4 9h16M4 15h16"/>',
};

const TYPES: Record<TypeKey, { label: string; color: string }> = {
  coach: { label: "Tenisový trenér", color: "#c8a24c" },
  club: { label: "Klub / areál", color: "#2e7d4f" },
  fitness: { label: "Fitness trenér", color: "#2f6fb0" },
  physio: { label: "Fyzioterapeut", color: "#d9534f" },
  academy: { label: "Akademie / škola", color: "#7a5bc0" },
  buddy: { label: "Sparring partner", color: "#1f9e8a" },
  stringer: { label: "Vyplétač", color: "#5a6470" },
};


type Point = { type: TypeKey; lat: number; lng: number; city: string; name: string; rate: string; id?: string; verified?: boolean };

const ALL_ON: Record<TypeKey, boolean> = {
  coach: true, club: true, fitness: true, physio: true, academy: true, buddy: true, stringer: true,
};

export default function MapExplorer() {
  const mapEl = useRef<HTMLDivElement>(null);
  const Lref = useRef<typeof LType | null>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const layerRef = useRef<LType.LayerGroup | null>(null);
  const circleRef = useRef<LType.Circle | null>(null);
  const homeRef = useRef<LType.Marker | null>(null);

  const [points, setPoints] = useState<Point[]>([]);

  // načtení reálných dat ze Supabase (specialisté + areály + sparring)
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [specs, vens, spar] = await Promise.all([
        supabase.from("specialists").select("id,kind,name,city,lat,lng,rating,venue_id,verified").eq("verified", true),
        supabase.from("venues").select("id,name,city,lat,lng,rating,verified").eq("verified", true),
        supabase.from("sparring_offers").select("city,lat,lng,note,level").eq("active", true),
      ]);
      const pts: Point[] = [];
      type Row = { id?: string; kind?: string; name?: string; city?: string | null; lat?: number | null; lng?: number | null; rating?: number | null; note?: string | null; level?: string | null; venue_id?: string | null; verified?: boolean };
      (specs.data as Row[] | null)?.forEach((s) => {
        if (s.venue_id) return; // trenér navázaný na areál → bez vlastního pinu (je v profilu areálu)
        if (s.lat != null && s.lng != null)
          pts.push({ type: (s.kind as TypeKey) ?? "coach", lat: s.lat, lng: s.lng, city: s.city ?? "", name: s.name ?? "", rate: s.rating ? String(s.rating) : "—", id: s.id, verified: !!s.verified });
      });
      (vens.data as Row[] | null)?.forEach((v) => {
        if (v.lat != null && v.lng != null)
          pts.push({ type: "club", lat: v.lat, lng: v.lng, city: v.city ?? "", name: v.name ?? "", rate: v.rating ? String(v.rating) : "—", id: v.id, verified: !!v.verified });
      });
      (spar.data as Row[] | null)?.forEach((b) => {
        if (b.lat != null && b.lng != null)
          pts.push({ type: "buddy", lat: b.lat, lng: b.lng, city: b.city ?? "", name: b.note ?? "Sparring partner", rate: b.level ?? "—" });
      });
      setPoints(pts);
    })();
  }, []);

  const [cityIndex, setCityIndex] = useState(0);
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"km" | "min">("km");
  const [val, setVal] = useState(25);
  const [active, setActive] = useState<Record<TypeKey, boolean>>(ALL_ON);
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);

  // přečti ?city a ?q ze search baru (přesměrování z homepage)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const city = sp.get("city");
    if (city !== null && Number.isFinite(+city) && +city >= 0 && +city < CITIES.length) setCityIndex(+city);
    const query = sp.get("q");
    if (query) setQ(query);
    const type = sp.get("type");
    if (type && type in ALL_ON) {
      const next = { ...ALL_ON };
      (Object.keys(next) as TypeKey[]).forEach((k) => { next[k] = k === type; });
      setActive(next);
    }
  }, []);

  const radiusKm = mode === "km" ? val : Math.round(val * 1.17); // dojezd → km (~70 km/h)

  // init map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current || mapRef.current) return;
      Lref.current = L;
      const map = L.map(mapEl.current, { scrollWheelZoom: true, zoomControl: true }).setView([49.82, 15.47], 7);
      mapRef.current = map;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap © CARTO",
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      circleRef.current = L.circle([CITIES[0][1], CITIES[0][2]], {
        radius: 25000, color: "#c8a24c", weight: 1.5, fillColor: "#c8a24c", fillOpacity: 0.07,
      }).addTo(map);
      homeRef.current = L.marker([CITIES[0][1], CITIES[0][2]], {
        icon: L.divIcon({ className: "", html: '<div class="home-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
        zIndexOffset: 1000,
      }).addTo(map);
      // kontejner mapy dostane velikost až po mountu → přepočítat, ať dlaždice i okruh sedí
      setTimeout(() => map.invalidateSize(), 100);
      setReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // re-render markers when filters change
  useEffect(() => {
    const L = Lref.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    const circle = circleRef.current;
    const home = homeRef.current;
    if (!ready || !L || !map || !layer || !circle || !home) return;

    const c = L.latLng(CITIES[cityIndex][1], CITIES[cityIndex][2]);
    circle.setLatLng(c).setRadius(radiusKm * 1000);
    home.setLatLng(c);
    layer.clearLayers();

    const pinIcon = (t: TypeKey, verified?: boolean) =>
      L.divIcon({
        className: "",
        html: `<div class="pin${verified ? " pin-verified" : ""}" style="background:${TYPES[t].color}"><svg viewBox="0 0 24 24">${ICONS[t]}</svg>${verified ? '<span class="pin-check">✓</span>' : ""}</div>`,
        iconSize: [34, 34], iconAnchor: [7, 32], popupAnchor: [10, -30],
      });

    let n = 0;
    points.forEach((p) => {
      if (!active[p.type]) return;
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return;
      if (c.distanceTo([p.lat, p.lng]) / 1000 > radiusKm) return;
      const pop =
        `<div class="pop"><div class="ph"><div class="badge" style="background:${TYPES[p.type].color}">` +
        `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[p.type]}</svg>` +
        `</div></div><div class="body"><b class="nm">${p.name}</b>` +
        `<div class="meta">${TYPES[p.type].label} · ${p.city}</div>` +
        (p.verified ? `<div class="pop-verif">✓ Ověřeno TenisHubem</div>` : "") +
        `<div class="stars">★★★★★ <span>${p.rate}</span></div>` +
        (p.type === "buddy"
          ? `<a href="/sparring" class="open">Sparring nabídky →</a></div></div>`
          : `<a href="${p.type === "club" ? `/areal/${p.id ?? ""}` : `/trener/${p.id ?? ""}`}" class="open">Otevřít profil →</a></div></div>`);
      L.marker([p.lat, p.lng], { icon: pinIcon(p.type, p.verified) }).bindPopup(pop, { closeButton: false }).addTo(layer);
      n++;
    });
    setCount(n);
  }, [ready, cityIndex, mode, val, active, radiusKm, points, q]);

  // recenter map when city changes
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    mapRef.current.setView([CITIES[cityIndex][1], CITIES[cityIndex][2]], 9);
  }, [ready, cityIndex]);

  const setModeSafe = (m: "km" | "min") => {
    setMode(m);
    if (m === "min" && val > 210) setVal(210);
  };

  return (
    <div className="map-page">
      <SiteHeader />

      <div className="map-main">
        <aside className="panel">
          <h1>Najít službu</h1>
          <div className="subt">Vyber místo, dojezd a typ služby — na mapě se ukážou nejbližší specialisté.</div>

          <div className="lab">Kde hledáte?</div>
          <select value={cityIndex} onChange={(e) => setCityIndex(+e.target.value)}>
            {CITIES.map((c, i) => (
              <option key={c[0]} value={i}>{c[0]}</option>
            ))}
          </select>

          <div className="lab">Vzdálenost</div>
          <div className="seg">
            <button className={mode === "km" ? "on" : ""} onClick={() => setModeSafe("km")} type="button">Okruh (km)</button>
            <button className={mode === "min" ? "on" : ""} onClick={() => setModeSafe("min")} type="button">Dojezd (min)</button>
          </div>
          <div className="rng">
            <div className="rngval">
              <span>{val}</span> <small>{mode === "km" ? "km" : "min"}</small>{" "}
              <small className="alt">{mode === "min" ? `(~${radiusKm} km)` : ""}</small>
            </div>
            <input
              type="range" min={5} max={mode === "km" ? 250 : 210} step={5}
              value={val} onChange={(e) => setVal(+e.target.value)}
            />
          </div>

          <div className="lab">Jaké služby?</div>
          <div className="types">
            {(Object.keys(TYPES) as TypeKey[]).map((k) => (
              <div
                key={k}
                className={`type${active[k] ? "" : " off"}`}
                onClick={() => setActive((a) => ({ ...a, [k]: !a[k] }))}
              >
                <span className="tic" style={{ background: TYPES[k].color }}>
                  <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: ICONS[k] }} />
                </span>
                <b>{TYPES[k].label}</b>
                <span className="chk">✓</span>
              </div>
            ))}
          </div>

          <div className="result">
            <div className="big">{count}</div>
            <small>nalezených služeb<br />v okruhu</small>
          </div>
        </aside>

        <div className="map-canvas" ref={mapEl} />
      </div>
    </div>
  );
}
