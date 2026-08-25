-- Knihovna „Vědět víc": ukázkové články zdarma pro nečleny.
-- is_sample = true → článek je celý veřejný (ochutnávka); jinak nečlen vidí
-- jen úvod a zbytek je pro členy. Spustit v Supabase SQL Editoru.
alter table public.articles add column if not exists is_sample boolean not null default false;
