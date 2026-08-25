"use client";

// Plovoucí lišta jen pro adminy: přepínání perspektivy webu (Admin / Rodič / Trenér / Návštěvník).
// V náhledu zůstává vidět a dá se kdykoli vrátit na Admin. Ovlivňuje gating přes useMe (viewAs).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getViewAs, setViewAs, type ViewAs } from "@/lib/viewAs";
import { ShieldCheck, Baby, GraduationCap, Eye } from "lucide-react";

const OPTS: { k: ViewAs; label: string; Icon: typeof Eye; href: string }[] = [
  { k: "admin", label: "Admin", Icon: ShieldCheck, href: "/admin" },
  { k: "rodic", label: "Rodič", Icon: Baby, href: "/rodic" },
  { k: "trener", label: "Trenér", Icon: GraduationCap, href: "/klub" },
  { k: "navstevnik", label: "Návštěvník", Icon: Eye, href: "/" },
];

export function AdminBar() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<ViewAs>("admin");

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setIsAdmin(false); return; }
      const p = await sb.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
      setIsAdmin(!!p.data?.is_admin);
      setView(getViewAs());
    })();
  }, []);

  if (!isAdmin) return null;

  const pick = (v: ViewAs, href: string) => { setViewAs(v); setView(v); router.push(href); router.refresh(); };

  return (
    <div className={`adminbar${view !== "admin" ? " preview" : ""}`}>
      <span className="adminbar-l">{view === "admin" ? "Náhled jako:" : "Náhled:"}</span>
      {OPTS.map((o) => (
        <button key={o.k} type="button" className={`adminbar-b${view === o.k ? " on" : ""}`} onClick={() => pick(o.k, o.href)}>
          <o.Icon size={14} /> {o.label}
        </button>
      ))}
    </div>
  );
}
