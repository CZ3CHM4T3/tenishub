-- ============================================================
-- TenisHub — nový typ specialisty: VYPLÉTAČ (stringer).
-- Spustit v Supabase SQL Editoru samostatně (ADD VALUE nesmí být v transakci).
-- Bezpečné opakovaně (IF NOT EXISTS, PG 12+).
-- ============================================================
alter type public.service_kind add value if not exists 'stringer';
