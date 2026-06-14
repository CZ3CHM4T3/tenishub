import { createClient } from "@supabase/supabase-js";
import { cache } from "react";

// Serverové (anon) čtení veřejných dat pro SSR/SEO. cache() = dedup v rámci requestu.
// Na Vercelu funguje; lokálně (blokovaná síť) fetch selže → vrací null/prázdno a stránka
// spadne zpět na klientské načítání.
function anon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}

export type SpecRow = {
  id: string; kind: string; name: string; bio: string | null; city: string | null;
  phone: string | null; email: string | null; website: string | null;
  price_from: number | null; verified: boolean; rating: number | null; reviews_count: number | null;
  status?: string | null; source?: string | null; venue_id?: string | null; photo_url?: string | null; owner_id?: string | null;
};
export type VenueRow = {
  id: string; name: string; city: string | null; description: string | null;
  amenities: string[] | null; verified: boolean; rating: number | null; reviews_count: number | null;
  status?: string | null; website?: string | null;
};
export type Court = { name: string; indoor: boolean; surface: string | null };
export type MiniTrainer = { id: string; name: string; kind: string };

export const getSpecialist = cache(async (id: string): Promise<SpecRow | null> => {
  try {
    const { data } = await anon().from("specialists").select("*").eq("id", id).maybeSingle();
    return (data as SpecRow) ?? null;
  } catch {
    return null;
  }
});

export const getVenue = cache(async (id: string): Promise<{ venue: VenueRow; courts: Court[]; trainers: MiniTrainer[] } | null> => {
  try {
    const sb = anon();
    const [{ data: v }, { data: c }, { data: t }] = await Promise.all([
      sb.from("venues").select("*").eq("id", id).maybeSingle(),
      sb.from("courts").select("name,indoor,surface").eq("venue_id", id),
      sb.from("specialists").select("id,name,kind").eq("venue_id", id).neq("status", "hidden"),
    ]);
    if (!v) return null;
    return { venue: v as VenueRow, courts: (c as Court[]) ?? [], trainers: (t as MiniTrainer[]) ?? [] };
  } catch {
    return null;
  }
});

export const listCity = cache(async (city: string): Promise<{ specs: SpecRow[]; vens: VenueRow[] }> => {
  try {
    const sb = anon();
    const [{ data: specs }, { data: vens }] = await Promise.all([
      sb.from("specialists").select("id,name,kind,city,rating,reviews_count,venue_id,status").eq("city", city).neq("status", "hidden"),
      sb.from("venues").select("id,name,city,rating,reviews_count,status").eq("city", city).neq("status", "hidden"),
    ]);
    return { specs: (specs as SpecRow[]) ?? [], vens: (vens as VenueRow[]) ?? [] };
  } catch {
    return { specs: [], vens: [] };
  }
});
