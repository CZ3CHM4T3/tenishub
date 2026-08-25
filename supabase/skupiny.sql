-- ============================================================
-- TenisHub — SKUPINY ("šuplíky") členů u trenéra + cílení akcí.
-- Trenér si roztřídí rodiče do skupin (věkové kategorie: babytenis, minitenis…)
-- a akci může poslat jen vybrané skupině. Spustit PO nastenka.sql.
-- ============================================================

-- šuplíky (skupiny) trenéra
create table if not exists public.coach_groups (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.coach_groups enable row level security;
drop policy if exists coach_groups_read on public.coach_groups;
create policy coach_groups_read on public.coach_groups for select using (
  coach_id = auth.uid() or public.is_admin() or
  exists (select 1 from public.coach_roster r where r.coach_id = coach_groups.coach_id and r.member_id = auth.uid() and r.status = 'active')
);
drop policy if exists coach_groups_write on public.coach_groups;
create policy coach_groups_write on public.coach_groups for all
  using (coach_id = auth.uid() or public.is_admin())
  with check (coach_id = auth.uid() or public.is_admin());

-- do jakých skupin patří člen (pole id skupin)
alter table public.coach_roster add column if not exists group_ids jsonb not null default '[]'::jsonb;

-- akce může cílit na jednu skupinu (null = celá komunita)
alter table public.coach_events add column if not exists group_id uuid references public.coach_groups(id) on delete set null;
