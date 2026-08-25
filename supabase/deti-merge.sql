-- ============================================================
-- TenisHub — sloučení evidence dítěte (nedestruktivní).
-- Dítě v klubu (deti) se naváže na hráče v Mojí cestě (cesta_players),
-- ať ho rodič nezadává dvakrát. Nic se nemaže.
-- Spustit v Supabase → SQL Editor. Bezpečné opakovaně.
-- ============================================================
alter table public.deti add column if not exists player_id uuid references public.cesta_players(id) on delete set null;
