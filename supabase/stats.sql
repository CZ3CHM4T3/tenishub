-- Veřejné statistiky pro homepage (reálná čísla). Security definer, ať jdou i přes RLS.
-- Spustit v Supabase SQL editoru.
create or replace function public.public_stats()
returns json language sql security definer stable as $$
  select json_build_object(
    'rodice',   (select count(distinct rodic_id) from public.deti),
    'deti',     (select count(*) from public.deti),
    'profici',  (select count(*) from public.specialists),
    'venues',   (select count(*) from public.venues)
  );
$$;
grant execute on function public.public_stats() to anon, authenticated;
