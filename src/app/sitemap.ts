import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

// Dynamická sitemapa: statické stránky + všechny veřejné profily z DB.
// force-dynamic → negeneruje se při buildu (kde je síť blokovaná), ale za běhu
// na Vercelu (kde fetch funguje). Když fetch selže, vrátí aspoň statické cesty.
export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://tenishub.cz";
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/mapa`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/sparring`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/soukromi`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/prihlaseni`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];

  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const [sp, ve] = await Promise.all([
      sb.from("specialists").select("id").neq("status", "hidden"),
      sb.from("venues").select("id").neq("status", "hidden"),
    ]);
    (sp.data ?? []).forEach((s: { id: string }) =>
      routes.push({ url: `${base}/trener/${s.id}`, lastModified: now, changeFrequency: "weekly", priority: 0.6 }),
    );
    (ve.data ?? []).forEach((v: { id: string }) =>
      routes.push({ url: `${base}/areal/${v.id}`, lastModified: now, changeFrequency: "weekly", priority: 0.6 }),
    );
  } catch {
    // síť nedostupná (lokální build) → zůstanou jen statické cesty
  }

  return routes;
}
