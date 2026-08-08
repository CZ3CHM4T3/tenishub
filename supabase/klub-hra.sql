-- ============================================================
-- TenisHub — KLUB / HERNÍ VRSTVA (port z MS GEM, scoped PER TRENÉR)
-- Spustit v Supabase SQL Editoru PO trener-system.sql. Bezpečné opakovaně.
--
-- Model věrný MS GEM: děti pod rodičem v klubu trenéra, tech tree (kurikulum)
-- PER TRENÉR, odemčené uzly = XP, Sparing Cup (zápasy) + žebříček per trenér.
-- Přístup: TRENÉR = malý admin svého klubu; RODIČ vidí své děti; ADMIN vidí
-- JEN strom trenéra (read-only), NE děti ani pořadí (to je věc trenéra).
-- ============================================================

-- ---------- DĚTI (svěřenci pod rodičem, v klubu jednoho trenéra) ----------
create table if not exists public.deti (
  id              uuid primary key default gen_random_uuid(),
  rodic_id        uuid not null references public.profiles(id) on delete cascade,
  coach_id        uuid references public.profiles(id) on delete set null,   -- klub trenéra
  jmeno           text not null,
  datum_narozeni  date,
  program         text not null default 'hobby',   -- hobby | pro
  avatar_model    text not null default 'stefan',
  avatar_pozadi   text not null default 'bg1',
  prezdivka       text not null default 'Šampion',
  level           int  not null default 0,
  kariera_vypnuta boolean not null default false,   -- rodič vypnul gamifikaci
  zebricek_anonym boolean not null default false,   -- v žebříčku jako „Anonym"
  poznamka        text,
  vytvoreno       timestamptz not null default now()
);
create index if not exists deti_rodic_idx on public.deti(rodic_id);
create index if not exists deti_coach_idx on public.deti(coach_id);
alter table public.deti enable row level security;

-- pomocné funkce (security definer → bez rekurze v RLS, jako v MS GEM)
create or replace function public.je_rodic_dite(p_dite uuid) returns boolean
  language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.deti where id = p_dite and rodic_id = auth.uid()); $$;
create or replace function public.je_coach_dite(p_dite uuid) returns boolean
  language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.deti where id = p_dite and coach_id = auth.uid()); $$;

-- rodič spravuje své děti; trenér svého klubu je vidí a upravuje (level); ADMIN NE.
drop policy if exists deti_rodic on public.deti;
create policy deti_rodic on public.deti for all
  using (rodic_id = auth.uid()) with check (rodic_id = auth.uid());
drop policy if exists deti_coach_read on public.deti;
create policy deti_coach_read on public.deti for select using (coach_id = auth.uid());
drop policy if exists deti_coach_upd on public.deti;
create policy deti_coach_upd on public.deti for update using (coach_id = auth.uid());

-- ---------- KURIKULUM (tech tree) PER TRENÉR ----------
-- Nahrazuje globální nastaveni['kurikulum'] z MS GEM. data = kapitoly+uzly (stejný tvar).
create table if not exists public.coach_kurikulum (
  coach_id   uuid primary key references public.profiles(id) on delete cascade,
  data       jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.coach_kurikulum enable row level security;
-- trenér edituje SVŮJ; admin jen ČTE (tajný náhled do stromu); rodič ČTE strom trenéra svého dítěte
drop policy if exists ck_coach on public.coach_kurikulum;
create policy ck_coach on public.coach_kurikulum for all
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());
drop policy if exists ck_admin_read on public.coach_kurikulum;
create policy ck_admin_read on public.coach_kurikulum for select using (public.is_admin());
drop policy if exists ck_parent_read on public.coach_kurikulum;
create policy ck_parent_read on public.coach_kurikulum for select
  using (coach_id in (select coach_id from public.deti where rodic_id = auth.uid()));

-- ---------- ODEMČENÉ UZLY (postup dítěte = zdroj XP) ----------
create table if not exists public.odemceno (
  id        uuid primary key default gen_random_uuid(),
  dite_id   uuid not null references public.deti(id) on delete cascade,
  kapitola  text not null,
  uzel      text not null,
  xp        int  not null default 0,
  odemkl    uuid references public.profiles(id),
  vytvoreno timestamptz not null default now(),
  unique (dite_id, kapitola, uzel)
);
create index if not exists odemceno_dite_idx on public.odemceno(dite_id);
alter table public.odemceno enable row level security;
drop policy if exists odemceno_read on public.odemceno;
create policy odemceno_read on public.odemceno for select
  using (public.je_rodic_dite(dite_id) or public.je_coach_dite(dite_id));
drop policy if exists odemceno_coach_write on public.odemceno;
create policy odemceno_coach_write on public.odemceno for all
  using (public.je_coach_dite(dite_id)) with check (public.je_coach_dite(dite_id));

-- ---------- SPARING CUP: ZÁPASY ----------
create table if not exists public.zapasy (
  id         uuid primary key default gen_random_uuid(),
  dite_id    uuid not null references public.deti(id) on delete cascade,
  souper     text not null,
  datum      date not null default current_date,
  gemy_pro   int  not null default 0,
  gemy_proti int  not null default 0,
  cup        text not null default 'hobby',   -- pro | hobby
  vytvoreno  timestamptz not null default now()
);
create index if not exists zapasy_dite_idx on public.zapasy(dite_id);
alter table public.zapasy enable row level security;
drop policy if exists zapasy_read on public.zapasy;
create policy zapasy_read on public.zapasy for select
  using (public.je_rodic_dite(dite_id) or public.je_coach_dite(dite_id));
drop policy if exists zapasy_coach_write on public.zapasy;
create policy zapasy_coach_write on public.zapasy for all
  using (public.je_coach_dite(dite_id)) with check (public.je_coach_dite(dite_id));

-- ---------- ŽEBŘÍČEK Sparing Cupu PER TRENÉR ----------
-- Security definer → agregace bez odhalení cizích zápasů. Volá trenér i rodič (svého klubu).
create or replace function public.zebricek_coach(p_coach uuid, p_cup text)
returns table(dite_id uuid, prezdivka text, avatar_model text, anonym boolean, body bigint, vyhry bigint, prohry bigint)
language sql security definer stable set search_path = public as $zeb$
  select z.dite_id, d.prezdivka, d.avatar_model, d.zebricek_anonym,
         coalesce(sum(z.gemy_pro), 0)::bigint,
         count(*) filter (where z.gemy_pro > z.gemy_proti)::bigint,
         count(*) filter (where z.gemy_pro < z.gemy_proti)::bigint
  from public.zapasy z join public.deti d on d.id = z.dite_id
  where d.coach_id = p_coach and z.cup = p_cup and d.kariera_vypnuta = false
  group by z.dite_id, d.prezdivka, d.avatar_model, d.zebricek_anonym
  order by 5 desc, 6 desc;
$zeb$;
