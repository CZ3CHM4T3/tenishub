-- ============================================================
-- TenisHub — KOMUNITA & OBSAH PRO RODIČE: Knihovna článků, Poradna,
-- Kalendář turnajů, Bazar + spolujízda. Spustit PO clenstvi.sql + admini.sql.
-- Bezpečné opakovaně. Čtení veřejné (SEO/bootstrap), zápis dle pravidel níže.
-- ============================================================

-- ---------- KNIHOVNA ČLÁNKŮ (píše admin, čtou všichni) ----------
create table if not exists public.articles (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  perex       text,
  body        text not null,
  category    text not null default 'navody',
  author_name text,
  cover_url   text,
  published   boolean not null default true,
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists articles_idx on public.articles(published, created_at desc);
alter table public.articles enable row level security;
drop policy if exists articles_read on public.articles;
drop policy if exists articles_write on public.articles;
create policy articles_read on public.articles for select
  using ((published and not hidden) or public.is_admin());
create policy articles_write on public.articles for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- PORADNA (ptá se HUB+ člen, odpovídá admin/odborník) ----------
create table if not exists public.advice (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid references auth.users(id) on delete set null,
  author_name text,
  topic       text not null default 'ostatni',
  body        text not null,
  answer      text,
  answered_by text,
  answered_at timestamptz,
  is_public   boolean not null default true,
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists advice_idx on public.advice(created_at desc);
alter table public.advice enable row level security;
drop policy if exists advice_read   on public.advice;
drop policy if exists advice_insert on public.advice;
drop policy if exists advice_modify on public.advice;
create policy advice_read on public.advice for select
  using ((answer is not null and is_public and not hidden) or author_id = auth.uid() or public.is_admin());
create policy advice_insert on public.advice for insert to authenticated
  with check (author_id = auth.uid());
create policy advice_modify on public.advice for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- KALENDÁŘ TURNAJŮ (spravuje admin) ----------
create table if not exists public.tournaments (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  date       date not null,
  city       text,
  category   text,
  surface    text,
  signup_url text,
  note       text,
  hidden     boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists tournaments_idx on public.tournaments(date);
alter table public.tournaments enable row level security;
drop policy if exists tournaments_read  on public.tournaments;
drop policy if exists tournaments_write on public.tournaments;
create policy tournaments_read on public.tournaments for select
  using (not hidden or public.is_admin());
create policy tournaments_write on public.tournaments for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- BAZAR + SPOLUJÍZDA (přidává HUB+ člen, čtou všichni) ----------
create table if not exists public.bazar_listings (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null default 'bazar' check (kind in ('bazar','spolujizda')),
  author_id   uuid references auth.users(id) on delete set null,
  author_name text,
  title       text not null,
  category    text,          -- bazar: raketa/boty/oblečení/ostatní
  city        text,
  price       text,          -- bazar: cena; spolujízda: počet míst
  body        text,
  contact     text,
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists bazar_idx on public.bazar_listings(kind, created_at desc);
alter table public.bazar_listings enable row level security;
drop policy if exists bazar_read   on public.bazar_listings;
drop policy if exists bazar_insert on public.bazar_listings;
drop policy if exists bazar_modify on public.bazar_listings;
create policy bazar_read on public.bazar_listings for select
  using (not hidden or public.is_admin());
create policy bazar_insert on public.bazar_listings for insert to authenticated
  with check (author_id = auth.uid());
create policy bazar_modify on public.bazar_listings for all
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());
