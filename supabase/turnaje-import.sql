-- ============================================================
-- TenisHub — import turnajů jednotlivců ze cesky-tenis.cz (dedup).
-- Spustit PO komunita.sql. Bezpečné opakovaně.
-- ============================================================
alter table public.tournaments add column if not exists ext_id text;
create index if not exists tournaments_ext_idx on public.tournaments(ext_id);
