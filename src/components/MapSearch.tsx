"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { CITIES } from "@/lib/cities";

export function MapSearch() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");

  const go = () => {
    const params = new URLSearchParams();
    if (city !== "") params.set("city", city);
    if (q.trim()) params.set("q", q.trim());
    router.push(`/mapa${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <div className="mapsearch">
      <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Město">
        <option value="">Celá ČR</option>
        {CITIES.map((c, i) => <option key={i} value={i}>{c[0]}</option>)}
      </select>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") go(); }}
        placeholder="Co hledáte? (trenér, kurt, fyzio…)"
      />
      <button type="button" className="btn btn-green" onClick={go}><Search size={16} /> Najít na mapě</button>
    </div>
  );
}
