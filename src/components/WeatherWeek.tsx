"use client";

// Reálné počasí na 7 dní podle města z profilu (Open-Meteo — bez API klíče, běží klientsky).
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CITIES } from "@/lib/cities";
import { Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, type LucideIcon } from "lucide-react";

type Day = { date: string; code: number; tmax: number; tmin: number; pop: number };

function wmo(code: number): { label: string; Icon: LucideIcon } {
  if (code === 0) return { label: "Jasno", Icon: Sun };
  if (code === 1 || code === 2) return { label: "Polojasno", Icon: CloudSun };
  if (code === 3) return { label: "Zataženo", Icon: Cloud };
  if (code === 45 || code === 48) return { label: "Mlha", Icon: CloudFog };
  if (code >= 51 && code <= 57) return { label: "Mrholení", Icon: CloudDrizzle };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { label: "Déšť", Icon: CloudRain };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: "Sníh", Icon: CloudSnow };
  if (code >= 95) return { label: "Bouřky", Icon: CloudLightning };
  return { label: "Oblačno", Icon: Cloud };
}

const dayName = (iso: string) => {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("cs-CZ", { weekday: "short" }).replace(".", "");
};
const dayNum = (iso: string) => { const d = new Date(iso + "T12:00:00"); return `${d.getDate()}.${d.getMonth() + 1}.`; };

export function WeatherWeek() {
  const [city, setCity] = useState("");
  const [days, setDays] = useState<Day[] | null>(null);
  const [err, setErr] = useState<"" | "nocity" | "geo" | "net">("");

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      let c = "";
      if (user) {
        const { data } = await sb.from("profiles").select("city").eq("id", user.id).maybeSingle();
        c = (data as { city: string | null } | null)?.city ?? "";
      }
      if (!c.trim()) { setErr("nocity"); return; }
      setCity(c);
      let lat: number | undefined, lng: number | undefined;
      const hit = CITIES.find(([n]) => n.toLowerCase() === c.trim().toLowerCase());
      if (hit) { lat = hit[1]; lng = hit[2]; }
      else {
        try {
          const g = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(c.trim())}&count=1&language=cs&country=CZ`);
          const gd = await g.json();
          if (gd.results?.[0]) { lat = gd.results[0].latitude; lng = gd.results[0].longitude; }
        } catch { /* padne níž */ }
      }
      if (lat == null || lng == null) { setErr("geo"); return; }
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FPrague&forecast_days=7`);
        const d = await r.json();
        const t: string[] = d.daily?.time ?? [];
        setDays(t.map((iso, i) => ({
          date: iso, code: d.daily.weather_code[i],
          tmax: Math.round(d.daily.temperature_2m_max[i]), tmin: Math.round(d.daily.temperature_2m_min[i]),
          pop: d.daily.precipitation_probability_max?.[i] ?? 0,
        })));
      } catch { setErr("net"); }
    })();
  }, []);

  if (err === "nocity") return (
    <div className="wx-card"><p className="member-note">Zadej si <b>město bydliště</b> v <Link href="/ucet?tab=profil" style={{ color: "var(--gold)", fontWeight: 700 }}>Profilu</Link> a uvidíš tu počasí na týden pro tvé okolí.</p></div>
  );
  if (err === "geo") return <div className="wx-card"><p className="member-note">Město „{city}" se nepodařilo najít na mapě — zkus přesnější název v profilu.</p></div>;
  if (err === "net") return <div className="wx-card"><p className="member-note">Počasí se teď nepodařilo načíst. Zkus to prosím později.</p></div>;
  if (!days) return <div className="wx-card"><p className="member-note">Načítám počasí pro {city}…</p></div>;

  return (
    <div className="wx-card">
      <div className="wx-head"><b>Počasí na týden</b> <span>{city}</span></div>
      <div className="wx-week">
        {days.map((d) => {
          const w = wmo(d.code);
          return (
            <div className="wx-day" key={d.date}>
              <span className="wx-dn">{dayName(d.date)}</span>
              <span className="wx-dd">{dayNum(d.date)}</span>
              <w.Icon size={26} className="wx-ic" />
              <span className="wx-t"><b>{d.tmax}°</b><i>{d.tmin}°</i></span>
              <span className="wx-pop">{d.pop}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
