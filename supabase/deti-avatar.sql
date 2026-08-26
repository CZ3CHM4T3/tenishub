-- ============================================================
-- TenisHub — avatar dítěte v záložce Děti (výběr ikony, mění rodič/dítě).
-- Spustit v Supabase → SQL Editor. Bezpečné opakovaně.
-- ============================================================
alter table public.deti add column if not exists avatar text;
