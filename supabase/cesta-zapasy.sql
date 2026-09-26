-- ============================================================
-- TenisHub — MOJE CESTA: TRACKER ZÁPASŮ (počítadlo bodů pro rodiče)
-- Spustit v Supabase SQL Editoru PO moje-cesta.sql (potřebuje cesta_players + my_player_ids()).
-- Bezpečné spouštět opakovaně.
--
-- Rodič u kurtu boduje zápas svého hráče po fiftýnech, tráví jak bod padl
-- (eso, dvojchyba, vítězný míč, brejk…). Rozehraný stav se průběžně ukládá do
-- `state` (JSON) → zápas jde pozastavit a dokončit později (obnova). Po dohrání
-- se doplní `score`, `win`, `sets` a spočtené `stats` pro statistiky v MOJE CESTA.
-- ============================================================

create table if not exists public.cesta_zapasy (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references public.cesta_players(id) on delete cascade,
  opponent    text,                                   -- soupeř (jméno)
  datum       date not null default current_date,
  surface     text,                                   -- antuka | hard | koberec | trava | hala
  turnaj      text,                                   -- název turnaje / akce (volitelně)
  kolo        text,                                   -- kolo (volitelně)
  cfg         jsonb not null default '{}'::jsonb,     -- formát zápasu: gamesTo, bestOf, superTB, noAd, startAt, bodyTo
  state       jsonb not null default '{}'::jsonb,     -- ŽIVÝ stav zápasu (sety, gemy, body, log bodů, události) — kvůli obnově
  status      text  not null default 'probiha' check (status in ('probiha','hotovo')),
  score       text,                                   -- výsledek textově, např. "6:4, 3:6, 10:7"
  win         boolean,                                -- vyhrál náš hráč?
  sets        jsonb,                                  -- [{"me":6,"opp":4}, …] pro rychlou analýzu
  stats       jsonb,                                  -- spočtené statistiky (esa, dvojchyby, vítězné míče, brejkboly, % 1. servisu, šňůry…)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists cesta_zapasy_player_idx on public.cesta_zapasy(player_id, datum desc);
create index if not exists cesta_zapasy_status_idx on public.cesta_zapasy(player_id, status);

-- updated_at se drží aktuální (kvůli „naposledy rozehráno")
create or replace function public.cesta_zapasy_touch()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists cesta_zapasy_touch on public.cesta_zapasy;
create trigger cesta_zapasy_touch before update on public.cesta_zapasy
  for each row execute function public.cesta_zapasy_touch();

-- RLS: rodič vidí/edituje jen zápasy svých hráčů (přes my_player_ids z moje-cesta.sql)
alter table public.cesta_zapasy enable row level security;
drop policy if exists cesta_zapasy_rw on public.cesta_zapasy;
create policy cesta_zapasy_rw on public.cesta_zapasy for all
  using (player_id in (select public.my_player_ids()))
  with check (player_id in (select public.my_player_ids()));

-- GRANTY pro Data API (od 30. 10. 2026 už je Supabase nepřidává novým tabulkám automaticky).
-- Data jsou soukromá → jen přihlášení (přes RLS) a serverová část, NE anon.
grant select, insert, update, delete on public.cesta_zapasy to authenticated;
grant select, insert, update, delete on public.cesta_zapasy to service_role;
