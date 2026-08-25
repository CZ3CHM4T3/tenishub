-- ============================================================
-- TenisHub — NÁSTĚNKA + AKCE (kalendář) s přihlašováním (RSVP).
-- Trenér vysílá oznámení a vytváří akce; jeho rodiče (roster) je vidí a přihlásí dítě.
-- Spustit v Supabase → SQL Editor. Bezpečné opakovaně.
-- ============================================================

-- ---------- NÁSTĚNKA (oznámení trenéra) ----------
create table if not exists public.coach_posts (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.coach_posts enable row level security;
drop policy if exists coach_posts_read on public.coach_posts;
create policy coach_posts_read on public.coach_posts for select using (
  coach_id = auth.uid() or public.is_admin() or
  exists (select 1 from public.coach_roster r where r.coach_id = coach_posts.coach_id and r.member_id = auth.uid() and r.status = 'active')
);
drop policy if exists coach_posts_write on public.coach_posts;
create policy coach_posts_write on public.coach_posts for all
  using (coach_id = auth.uid() or public.is_admin())
  with check (coach_id = auth.uid() or public.is_admin());
create index if not exists coach_posts_coach_idx on public.coach_posts(coach_id, created_at desc);

-- ---------- AKCE / KALENDÁŘ ----------
create table if not exists public.coach_events (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  place text,
  body text,
  capacity int,                       -- null = neomezeno
  allow_rsvp boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.coach_events enable row level security;
drop policy if exists coach_events_read on public.coach_events;
create policy coach_events_read on public.coach_events for select using (
  coach_id = auth.uid() or public.is_admin() or
  exists (select 1 from public.coach_roster r where r.coach_id = coach_events.coach_id and r.member_id = auth.uid() and r.status = 'active')
);
drop policy if exists coach_events_write on public.coach_events;
create policy coach_events_write on public.coach_events for all
  using (coach_id = auth.uid() or public.is_admin())
  with check (coach_id = auth.uid() or public.is_admin());
create index if not exists coach_events_coach_idx on public.coach_events(coach_id, starts_at);

-- ---------- PŘIHLÁŠKY (RSVP) ----------
create table if not exists public.event_rsvp (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.coach_events(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  member_name text,
  status text not null default 'going',   -- going | out
  created_at timestamptz not null default now(),
  unique (event_id, member_id)
);
alter table public.event_rsvp enable row level security;
-- rodič spravuje jen svou přihlášku
drop policy if exists rsvp_self on public.event_rsvp;
create policy rsvp_self on public.event_rsvp for all
  using (member_id = auth.uid())
  with check (member_id = auth.uid());
-- trenér vidí přihlášky na své akce (a admin vše)
drop policy if exists rsvp_coach_read on public.event_rsvp;
create policy rsvp_coach_read on public.event_rsvp for select using (
  public.is_admin() or
  exists (select 1 from public.coach_events e where e.id = event_rsvp.event_id and e.coach_id = auth.uid())
);
create index if not exists event_rsvp_event_idx on public.event_rsvp(event_id);
