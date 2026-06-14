-- ============================================================
-- TenisHub — SPARRING v2: bohatší kritéria. PO RUN-ALL.sql. Bezpečné opakovaně.
-- ============================================================
alter table public.sparring_offers add column if not exists age        smallint;
alter table public.sparring_offers add column if not exists play_type  text;  -- amateur | competitive
alter table public.sparring_offers add column if not exists gender     text;  -- m | f | any
alter table public.sparring_offers add column if not exists handedness text;  -- right | left
alter table public.sparring_offers add column if not exists surface    text;  -- antuka | hala | tvrdy | any
