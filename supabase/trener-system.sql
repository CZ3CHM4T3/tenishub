-- ============================================================
-- TenisHub — TRENÉRSKÝ SYSTÉM, fáze 1: pozvánky (magic link) + role trenér + svěřenci
-- Spustit v Supabase SQL Editoru PO clenstvi.sql/admini.sql. Bezpečné opakovaně.
--
-- Flow:
--  1) Admin vygeneruje pozvánku pro trenéra (kód TRN-xxxxxx) → pošle link.
--  2) Trenér se registruje s ?invite=TRN-... → stane se trenérem (is_coach) a dostane
--     svůj OSOBNÍ zvací kód (C-xxxxxx), který vidí jen on (a admin).
--  3) Rodiče/kolegové se registrují s jeho ?invite=C-... → připojí se pod trenéra (roster).
-- ============================================================

-- role trenér + osobní zvací kód
alter table public.profiles add column if not exists is_coach   boolean not null default false;
alter table public.profiles add column if not exists coach_code text;
create unique index if not exists profiles_coach_code_idx on public.profiles(coach_code) where coach_code is not null;

-- jednorázové pozvánky admin -> trenér
create table if not exists public.coach_invites (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,
  created_by uuid references auth.users(id) on delete set null,
  used_by    uuid references auth.users(id) on delete set null,
  used_at    timestamptz,
  note       text,
  created_at timestamptz not null default now()
);
alter table public.coach_invites enable row level security;
drop policy if exists coach_invites_admin on public.coach_invites;
create policy coach_invites_admin on public.coach_invites for all
  using (public.is_admin()) with check (public.is_admin());

-- svěřenci / členové pod trenérem (rodič nebo kolega)
create table if not exists public.coach_roster (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references public.profiles(id) on delete cascade,
  member_id   uuid not null references public.profiles(id) on delete cascade,
  member_name text,
  kind        text not null default 'parent',   -- parent | colleague
  status      text not null default 'active',    -- active | removed
  created_at  timestamptz not null default now(),
  unique (coach_id, member_id)
);
alter table public.coach_roster enable row level security;
drop policy if exists coach_roster_read on public.coach_roster;
create policy coach_roster_read on public.coach_roster for select
  using (coach_id = auth.uid() or member_id = auth.uid() or public.is_admin());
drop policy if exists coach_roster_coach_upd on public.coach_roster;
create policy coach_roster_coach_upd on public.coach_roster for update
  using (coach_id = auth.uid() or public.is_admin());
create index if not exists coach_roster_coach_idx on public.coach_roster(coach_id);

-- ---------- RPC ----------
-- Admin vygeneruje pozvánku pro trenéra, vrátí kód.
create or replace function public.gen_coach_invite(p_note text default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if not public.is_admin() then raise exception 'Jen admin může zvát trenéry.'; end if;
  v_code := 'TRN-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
  insert into public.coach_invites(code, created_by, note) values (v_code, auth.uid(), p_note);
  return v_code;
end $$;

-- Uplatnění kódu po registraci: buď se stanu trenérem (TRN-), nebo se připojím pod trenéra (C-).
create or replace function public.apply_invite(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare v_inv public.coach_invites; v_coach public.profiles; v_name text;
begin
  if auth.uid() is null then raise exception 'Nejste přihlášen.'; end if;
  p_code := upper(trim(p_code));

  -- trenérská pozvánka?
  select * into v_inv from public.coach_invites where upper(code) = p_code and used_by is null;
  if found then
    update public.coach_invites set used_by = auth.uid(), used_at = now() where id = v_inv.id;
    update public.profiles
      set is_coach = true,
          coach_code = coalesce(coach_code, 'C-' || upper(substr(md5(gen_random_uuid()::text), 1, 6)))
      where id = auth.uid();
    return 'coach';
  end if;

  -- osobní kód trenéra (rodič/kolega se připojuje)?
  select * into v_coach from public.profiles where upper(coach_code) = p_code and is_coach = true;
  if found then
    if v_coach.id = auth.uid() then return 'self'; end if;
    select coalesce(full_name, email) into v_name from public.profiles where id = auth.uid();
    insert into public.coach_roster(coach_id, member_id, member_name)
      values (v_coach.id, auth.uid(), v_name)
      on conflict (coach_id, member_id) do nothing;
    return 'joined';
  end if;

  return 'invalid';
end $$;

-- Zajistí trenérovi osobní kód (kdyby chyběl) a vrátí ho — volá si trenér ve svém rozhraní.
create or replace function public.my_coach_code()
returns text language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if auth.uid() is null then raise exception 'Nejste přihlášen.'; end if;
  select coach_code into v_code from public.profiles where id = auth.uid() and is_coach = true;
  if v_code is null then
    if not exists (select 1 from public.profiles where id = auth.uid() and is_coach = true) then
      raise exception 'Nejste trenér.';
    end if;
    v_code := 'C-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    update public.profiles set coach_code = v_code where id = auth.uid();
  end if;
  return v_code;
end $$;
