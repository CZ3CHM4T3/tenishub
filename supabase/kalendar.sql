-- Osobní kalendář v účtu: vlastní barevné akce uživatele (rezervace se berou z bookings).
-- Spustit v Supabase SQL editoru. Bezpečné pustit víckrát (IF NOT EXISTS).

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  event_date date not null,
  color text not null default '#2c4a3b',
  created_at timestamptz not null default now()
);

create index if not exists calendar_events_user_date_idx on public.calendar_events (user_id, event_date);

alter table public.calendar_events enable row level security;

-- Každý vidí a spravuje jen své vlastní akce.
drop policy if exists "cal own select" on public.calendar_events;
create policy "cal own select" on public.calendar_events for select using (auth.uid() = user_id);

drop policy if exists "cal own insert" on public.calendar_events;
create policy "cal own insert" on public.calendar_events for insert with check (auth.uid() = user_id);

drop policy if exists "cal own update" on public.calendar_events;
create policy "cal own update" on public.calendar_events for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "cal own delete" on public.calendar_events;
create policy "cal own delete" on public.calendar_events for delete using (auth.uid() = user_id);
