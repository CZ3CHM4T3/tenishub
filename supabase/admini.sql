-- ============================================================
-- TenisHub — ADMINI (Jan + Jirka) a admin přístup k platbám.
-- Spustit v Supabase SQL Editoru celé najednou (PO clenstvi.sql).
-- ============================================================

-- 1) Admin e-maily: kdo se registruje těmito maily, je automaticky admin.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    lower(new.email) in ('schroffelh@seznam.cz', 'machekjirka@gmail.com')
  )
  on conflict (id) do update
    set email = excluded.email,
        is_admin = excluded.is_admin or public.profiles.is_admin;
  return new;
end; $$;

-- 2) A rovnou nastavit adminy i pro UŽ existující účty s těmito maily:
update public.profiles set is_admin = true
  where id in (select id from auth.users where lower(email) in ('schroffelh@seznam.cz', 'machekjirka@gmail.com'));

-- 3) Admin vidí všechny rezervace/platby (kvůli přehledu v administraci):
drop policy if exists bookings_read on public.bookings;
create policy bookings_read on public.bookings for select using (
  customer_id = auth.uid()
  or specialist_id in (select id from public.specialists where owner_id = auth.uid())
  or court_id in (select c.id from public.courts c join public.venues v on v.id = c.venue_id where v.owner_id = auth.uid())
  or public.is_admin()
);
