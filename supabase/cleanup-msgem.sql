-- ============================================================
-- ÚKLID: omylem spuštěné MS GEM SQL v databázi TENISHUB
-- ------------------------------------------------------------
-- Spusť CELÉ najednou v Supabase SQL Editoru (projekt TenisHub).
-- Vše je "if exists" → co v DB není, se bezpečně přeskočí. Nesahá
-- na žádnou TenisHub tabulku ani data — jen odstraní cizí MS GEM
-- objekty a obnoví 2 sdílené funkce, které mohl MS GEM přepsat.
-- Bezpečné spustit i víckrát.
-- ============================================================

-- ── A) Smazat MS GEM tabulky, které TenisHub NEPOUŽÍVÁ ──────
-- (rozvrhy, docházka, omluvy/náhrady, oznámení, akce/kempy, chat,
--  market, helpdesk, poznámky, push, aktuality, nastaveni, turnaje MS GEM…)
drop table if exists public.rozvrh_zaci        cascade;
drop table if exists public.rozvrh             cascade;
drop table if exists public.dochazka           cascade;
drop table if exists public.zrusene_lekce      cascade;
drop table if exists public.omluvy             cascade;
drop table if exists public.nahrady_vyuzite    cascade;
drop table if exists public.nahrady            cascade;
drop table if exists public.akce_prihlaseni    cascade;   -- vč. kemp přihlášek (bezinfekčnost atd.)
drop table if exists public.akce               cascade;
drop table if exists public.oznameni_navrhy    cascade;
drop table if exists public.oznameni           cascade;
drop table if exists public.aktuality          cascade;
drop table if exists public.market             cascade;
drop table if exists public.helpdesk           cascade;
drop table if exists public.poznamky           cascade;
drop table if exists public.push_subs          cascade;
drop table if exists public.nastaveni          cascade;   -- MS GEM globální nastavení (vč. jejich kurikula)
drop table if exists public.turnaj_ucast       cascade;   -- POZOR: TenisHub používá "tournaments", ne "turnaje"
drop table if exists public.turnaje            cascade;
drop table if exists public.chat_mention       cascade;
drop table if exists public.chat_dm            cascade;
drop table if exists public.chat_zpravy        cascade;
drop table if exists public.chat_members       cascade;
drop table if exists public.chat_rooms         cascade;

-- ── B) Odstranit CIZÍ MS GEM RLS politiky přidané na SDÍLENÉ
--       tabulky (TenisHub má vlastní politiky s jinými názvy,
--       těch se to NEDOTKNE — mažeme jen MS GEM názvy) ────────
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists profiles_delete on public.profiles;
drop policy if exists deti_select     on public.deti;
drop policy if exists deti_insert     on public.deti;
drop policy if exists deti_update     on public.deti;
drop policy if exists deti_delete     on public.deti;
drop policy if exists odemceno_select on public.odemceno;
drop policy if exists odemceno_insert on public.odemceno;
drop policy if exists odemceno_delete on public.odemceno;
drop policy if exists zapasy_select   on public.zapasy;
drop policy if exists zapasy_write    on public.zapasy;

-- ── C) Odstranit MS GEM triggery na deti (mohly by rozbít
--       přidávání/úpravu dětí v TenisHubu) ────────────────────
drop trigger if exists trg_deti_dedi_partnera on public.deti;
drop trigger if exists deti_guard_upd         on public.deti;

-- ── D) OBNOVIT sdílené funkce na SPRÁVNÉ TenisHub verze
--       (MS GEM je přes "create or replace" mohl přepsat) ──────
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

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

-- ── HOTOVO. TenisHub tabulky, data ani jeho vlastní politiky
--    zůstaly nedotčené; cizí MS GEM objekty jsou pryč a sdílené
--    funkce zpět ve správné verzi.
-- ------------------------------------------------------------
-- (NEPOVINNÉ) MS GEM přidal do sdílených tabulek pár sloupců
-- navíc (profiles.jmeno; deti.zdravotni/preference_*/frekvence/
-- kariera_vypnuta/rodic2_id). Jsou neškodné (TenisHub je nečte).
-- Když je chceš i tak uklidit, odkomentuj:
-- alter table public.profiles drop column if exists jmeno;
-- alter table public.deti drop column if exists zdravotni;
-- alter table public.deti drop column if exists preference_treninku;
-- alter table public.deti drop column if exists preference_navrh;
-- alter table public.deti drop column if exists frekvence;
-- alter table public.deti drop column if exists kariera_vypnuta;
-- alter table public.deti drop column if exists rodic2_id;
-- (POZOR: deti.zebricek_anonym NEMAZAT — tu TenisHub používá!)
