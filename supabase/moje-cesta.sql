-- ============================================================
-- TenisHub — MOJE CESTA (sezónní průvodce hráče). Fáze 1 (MVP).
-- Spustit v Supabase SQL Editoru PO clenstvi.sql + admini.sql. Bezpečné opakovaně.
--
-- Model: účet má 1+ HRÁČŮ (dítě spravované rodičem i dospělý sám). Každý hráč má
-- události (kalendář), cíle sezóny a fáze sezóny (osa). Globální nastavení (typy
-- událostí + šablona sezóny) ladí admin.
-- ============================================================

-- ---------- HRÁČI ----------
create table if not exists public.cesta_players (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null,
  level      text not null default 'hobby' check (level in ('hobby','competitive')),
  birth_year smallint,
  created_at timestamptz not null default now()
);
create index if not exists cesta_players_owner_idx on public.cesta_players(owner_id);
-- pojistka i pro již existující tabulku: owner_id se doplní z přihlášeného uživatele
alter table public.cesta_players alter column owner_id set default auth.uid();
-- závodní hráč: soutěž/třída (volný text, např. "4. třída D"), aktuální místo v žebříčku, reg. číslo ČTS
alter table public.cesta_players add column if not exists category text;
alter table public.cesta_players add column if not exists ranking  integer;
alter table public.cesta_players add column if not exists cts_id   text;

alter table public.cesta_players enable row level security;
drop policy if exists cesta_players_rw on public.cesta_players;
create policy cesta_players_rw on public.cesta_players for all
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

-- pomocná: hráči, na které mám právo (vlastník nebo admin)
create or replace function public.my_player_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select id from public.cesta_players
  where owner_id = auth.uid() or public.is_admin();
$$;

-- ---------- UDÁLOSTI (kalendář) ----------
create table if not exists public.cesta_events (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references public.cesta_players(id) on delete cascade,
  date       date not null,
  type       text not null default 'training',  -- klíč z cesta_settings.event_types
  title      text,
  location   text,
  link       text,
  notes      text,
  opponent   text,        -- turnaj: soupeř
  score      text,        -- turnaj: skóre (textově, odvozeno ze setů)
  win        boolean,     -- turnaj: výhra?
  sets       jsonb,       -- turnaj: pole setů [{"me":6,"opp":4},…] pro analýzu (dotažení, otočky…)
  surface    text,        -- povrch: antuka | hard | koberec | trava | hala
  games      jsonb,       -- volitelně: pořadí gemů [["m","o","m",…],[…]] (mentální statistika)
  aces       smallint,    -- esa
  dfaults    smallint,    -- dvojchyby
  created_at timestamptz not null default now()
);
alter table public.cesta_events add column if not exists sets jsonb;
alter table public.cesta_events add column if not exists surface text;
alter table public.cesta_events add column if not exists games jsonb;
alter table public.cesta_events add column if not exists aces smallint;
alter table public.cesta_events add column if not exists dfaults smallint;
create index if not exists cesta_events_player_idx on public.cesta_events(player_id, date);

alter table public.cesta_events enable row level security;
drop policy if exists cesta_events_rw on public.cesta_events;
create policy cesta_events_rw on public.cesta_events for all
  using (player_id in (select public.my_player_ids()))
  with check (player_id in (select public.my_player_ids()));

-- ---------- CÍLE SEZÓNY ----------
create table if not exists public.cesta_goals (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references public.cesta_players(id) on delete cascade,
  title      text not null,
  target     text,
  progress   smallint not null default 0 check (progress between 0 and 100),
  done       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists cesta_goals_player_idx on public.cesta_goals(player_id);

alter table public.cesta_goals enable row level security;
drop policy if exists cesta_goals_rw on public.cesta_goals;
create policy cesta_goals_rw on public.cesta_goals for all
  using (player_id in (select public.my_player_ids()))
  with check (player_id in (select public.my_player_ids()));

-- ---------- FÁZE SEZÓNY (osa, per hráč) ----------
create table if not exists public.cesta_phases (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references public.cesta_players(id) on delete cascade,
  kind       text,                 -- prep | main | off
  label      text not null,
  color      text not null default '#cdd3da',
  start_date date not null,
  end_date   date not null
);
create index if not exists cesta_phases_player_idx on public.cesta_phases(player_id);

alter table public.cesta_phases enable row level security;
drop policy if exists cesta_phases_rw on public.cesta_phases;
create policy cesta_phases_rw on public.cesta_phases for all
  using (player_id in (select public.my_player_ids()))
  with check (player_id in (select public.my_player_ids()));

-- ---------- NASTAVENÍ (1 řádek, ladí admin) ----------
create table if not exists public.cesta_settings (
  id              smallint primary key default 1 check (id = 1),
  event_types     jsonb not null default '[
    {"key":"training","label":"Trénink","color":"#7C4DD6"},
    {"key":"tournament","label":"Turnaj","color":"#bf9a47"},
    {"key":"conditioning","label":"Kondice","color":"#3b8a5a"},
    {"key":"recovery","label":"Regenerace","color":"#4a9bd6"},
    {"key":"rest","label":"Volno","color":"#cdd3da"}
  ]'::jsonb,
  season_template jsonb not null default '[
    {"kind":"prep","label":"Příprava","color":"#3b8a5a","start":"11-01","end":"03-31"},
    {"kind":"main","label":"Sezóna","color":"#bf9a47","start":"04-01","end":"09-30"},
    {"kind":"off","label":"Mezisezóna","color":"#cdd3da","start":"10-01","end":"10-31"}
  ]'::jsonb,
  updated_at      timestamptz not null default now()
);
insert into public.cesta_settings (id) values (1) on conflict (id) do nothing;

alter table public.cesta_settings enable row level security;
drop policy if exists cesta_settings_read  on public.cesta_settings;
drop policy if exists cesta_settings_write on public.cesta_settings;
create policy cesta_settings_read  on public.cesta_settings for select using (true);
create policy cesta_settings_write on public.cesta_settings for all
  using (public.is_admin()) with check (public.is_admin());
