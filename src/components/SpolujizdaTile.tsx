"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Car, ArrowRight, Lock } from "lucide-react";

// Spolujízda funguje jen v rámci komunity u trenéra. Solo rodič ji vidí,
// ale neaktivní (dokud se nepřipojí k trenérovi).
export function SpolujizdaTile() {
  const supabase = useMemo(() => createClient(), []);
  const [hasCoach, setHasCoach] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setHasCoach(false); return; }
      const { data } = await supabase.from("coach_roster").select("coach_id").eq("member_id", user.id).eq("status", "active").limit(1).maybeSingle();
      setHasCoach(!!data);
    })();
  }, [supabase]);

  if (hasCoach === false) return (
    <span className="rolepick rolepick-locked" style={{ backgroundColor: "#3b8a5a" }} title="Aktivní, až se přidáte k trenérovi">
      <span className="rolepick-ic" style={{ color: "#3b8a5a" }}><Car size={22} /></span>
      <span className="rolepick-txt"><b>Spolujízda <span className="hm-badge">v komunitě</span></b><span>aktivní až u trenéra</span></span>
      <span className="rolepick-arr"><Lock size={16} /></span>
    </span>
  );

  return (
    <Link href="/bazar?tab=spolujizda" className="rolepick" style={{ backgroundColor: "#3b8a5a", backgroundImage: "url(/spolujizda.png)" }}>
      <span className="rolepick-ic" style={{ color: "#3b8a5a" }}><Car size={22} /></span>
      <span className="rolepick-txt"><b>Spolujízda <span className="hm-badge">HUBplus</span></b><span>odvoz na trénink i turnaj</span></span>
      <span className="rolepick-arr"><ArrowRight size={18} /></span>
    </Link>
  );
}
