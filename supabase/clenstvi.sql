-- ============================================================
-- TenisHub — ČLENSTVÍ (HUB+) + ADMIN. Spustit v Supabase SQL Editoru
-- (celé najednou, PO schema.sql). Bezpečné spustit opakovaně.
-- ============================================================

-- profily: admin flag + e-mail (pro admin přehled)
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists email text;

-- trigger po registraci ukládá i e-mail
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end; $$;

-- pomocná funkce: je přihlášený uživatel admin? (security definer kvůli RLS)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- ============================================================
-- ČLENSTVÍ
-- ============================================================
create table if not exists public.memberships (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  plan        text not null default 'hubplus',
  status      text not null default 'active',          -- active | cancelled
  started_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  auto_renew  boolean not null default true,
  price_czk   int not null default 200,
  created_at  timestamptz not null default now()
);
create index if not exists memberships_profile_idx on public.memberships(profile_id);

alter table public.memberships enable row level security;

drop policy if exists memberships_read   on public.memberships;
drop policy if exists memberships_insert on public.memberships;
drop policy if exists memberships_update on public.memberships;
create policy memberships_read on public.memberships for select
  using (profile_id = auth.uid() or public.is_admin());
create policy memberships_insert on public.memberships for insert
  with check (profile_id = auth.uid() or public.is_admin());
create policy memberships_update on public.memberships for update
  using (profile_id = auth.uid() or public.is_admin());

-- ============================================================
-- SOUKROMÍ: profily už NEČÍST veřejně (jsou tam e-maily).
-- Každý vidí svůj profil, admin vidí všechny.
-- ============================================================
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select
  using (id = auth.uid() or public.is_admin());

-- ============================================================
-- ADMIN = JAN: po své registraci na webu spusť s tvým e-mailem:
-- update public.profiles set is_admin = true
--   where id in (select id from auth.users where email = 'TVUJ@EMAIL.CZ');
-- ============================================================
