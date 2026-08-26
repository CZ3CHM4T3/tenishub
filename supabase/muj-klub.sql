-- ============================================================
-- TenisHub — parent "Můj klub": člen (aktivní v coach_roster) čte nástěnku
-- i kalendář svého trenéra a smí přidat akci do kalendáře (oboustranný kalendář).
-- Spustit v Supabase → SQL Editor PO clenstvi.sql (kvůli is_admin()). Bezpečné opakovaně.
-- ============================================================

alter table public.coach_events add column if not exists author_name text;

-- je přihlášený uživatel aktivní člen daného trenéra?
create or replace function public.is_coach_member(p_coach uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.coach_roster r
    where r.coach_id = p_coach and r.member_id = auth.uid() and r.status = 'active'
  );
$$;

-- NÁSTĚNKA: člen (a majitel/admin) čte
drop policy if exists coach_posts_member_read on public.coach_posts;
create policy coach_posts_member_read on public.coach_posts
  for select using (public.is_coach_member(coach_id) or coach_id = auth.uid() or public.is_admin());

-- KALENDÁŘ: člen čte + smí vložit akci (jako autor) do kalendáře svého trenéra
drop policy if exists coach_events_member_read on public.coach_events;
create policy coach_events_member_read on public.coach_events
  for select using (public.is_coach_member(coach_id) or coach_id = auth.uid() or public.is_admin());

drop policy if exists coach_events_member_insert on public.coach_events;
create policy coach_events_member_insert on public.coach_events
  for insert with check (public.is_coach_member(coach_id));

-- rodič smí smazat jen akci, kterou sám přidal (autorská); trenér maže vše (stávající politika)
drop policy if exists coach_events_member_del on public.coach_events;
create policy coach_events_member_del on public.coach_events
  for delete using (public.is_coach_member(coach_id) and author_name is not null);
