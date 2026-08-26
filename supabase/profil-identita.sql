-- ============================================================
-- TenisHub — sdílená identita profilu (foto). Jméno/město/telefon už v profiles jsou.
-- Osobní údaje se vyplní JEDNOU v profilu a propíšou se do karet (specialists).
-- Spustit v Supabase → SQL Editor. Bezpečné opakovaně.
-- ============================================================
alter table public.profiles add column if not exists photo_url text;
