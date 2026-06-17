-- ============================================================
-- TenisHub — REÁLNÁ REZERVACE: dostupnost trenéra + obsazené termíny.
-- Spustit v Supabase SQL Editoru PO RUN-ALL.sql. Bezpečné opakovaně.
-- ============================================================

-- Týdenní dostupnost specialisty (opakuje se každý týden).
-- weekday: 0=neděle … 6=sobota (JS getDay). Čas v minutách od půlnoci.
create table if not exists public.availability (
  id            uuid primary key default gen_random_uuid(),
  specialist_id uuid not null references public.specialists(id) on delete cascade,
  weekday       smallint not null check (weekday between 0 and 6),
  start_min     smallint not null,
  end_min       smallint not null,
  slot_min      smallint not null default 60,
  created_at    timestamptz not null default now()
);
create index if not exists availability_spec_idx on public.availability(specialist_id);

alter table public.availability enable row level security;
drop policy if exists availability_read  on public.availability;
drop policy if exists availability_write on public.availability;
create policy availability_read on public.availability for select using (true);
create policy availability_write on public.availability for all
  using (specialist_id in (select id from public.specialists where owner_id = auth.uid()))
  with check (specialist_id in (select id from public.specialists where owner_id = auth.uid()));

-- Obsazené termíny specialisty — vrací JEN časy (ne kdo), aby šly skrýt volné/obsazené
-- bez prozrazení soukromí zákazníků. SECURITY DEFINER obchází RLS bookings.
create or replace function public.taken_slots(p_specialist uuid)
returns setof timestamptz
language sql stable security definer set search_path = public as $$
  select starts_at from public.bookings
  where specialist_id = p_specialist and status <> 'cancelled' and starts_at > now();
$$;
