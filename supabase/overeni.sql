-- ============================================================
-- TenisHub — žádost o ověření (poskytovatelský model). Spustit PO schema/claimable.
-- Bezpečné opakovaně. Poskytovatel s HUB+ klikne „Chci ověření" → verify_requested=true;
-- admin ve frontě schválí (verified=true, verify_requested=false).
-- ============================================================
alter table public.specialists add column if not exists verify_requested boolean not null default false;
alter table public.venues      add column if not exists verify_requested boolean not null default false;
