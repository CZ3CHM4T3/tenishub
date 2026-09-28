"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { citySlug } from "@/lib/cities";

// „Tenis ve městech" v patičce — jen města, kde REÁLNĚ je ověřený pin (specialist/areál).
// Roste samo, jak přibývají ověřené profily na mapě. Fallback: Dobřichovice (sídlo MS GEM).
export function FooterCities() {
  const [cities, setCities] = useState<string[]>(["Dobřichovice"]);
  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const [s, v] = await Promise.all([
          sb.from("specialists").select("city").eq("verified", true).not("city", "is", null),
          sb.from("venues").select("city").eq("verified", true).not("city", "is", null),
        ]);
        const set = new Set<string>();
        (s.data ?? []).forEach((r: { city: string | null }) => r.city && set.add(r.city.trim()));
        (v.data ?? []).forEach((r: { city: string | null }) => r.city && set.add(r.city.trim()));
        if (set.size) setCities([...set].sort((a, b) => a.localeCompare(b, "cs")));
      } catch { /* offline/fallback → Dobřichovice */ }
    })();
  }, []);

  return (
    <div className="foot-city-links">
      {cities.map((c) => (
        <Link key={c} href={`/tenis/${citySlug(c)}`}>{c}</Link>
      ))}
    </div>
  );
}
