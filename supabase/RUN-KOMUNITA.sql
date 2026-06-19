-- ============================================================
-- TenisHub — RUN-KOMUNITA.sql = JEDEN soubor pro poslední vlnu funkcí.
-- Obsahuje: fórum, komunita (články/poradna/turnaje/bazar), ověření,
-- import turnajů, e-mail notifikace. Spustit v Supabase SQL Editoru NAJEDNOU.
-- Předpoklad: už běží schema/clenstvi/admini/RUN-ALL/RUN-FUNKCE/moje-cesta.
-- Bezpečné opakovaně (IF NOT EXISTS / create or replace / drop policy if exists).
-- ============================================================


-- >>>>>>>>>>>>>>>>>>>> forum.sql <<<<<<<<<<<<<<<<<<<<

-- ============================================================
-- TenisHub — DISKUZNÍ FÓRUM (komunita rodičů). Spustit v Supabase SQL Editoru
-- PO clenstvi.sql + admini.sql. Bezpečné opakovaně.
--
-- Čtení VEŘEJNÉ (kvůli SEO + bootstrap); zakládat témata a odpovídat smí přihlášený
-- HUB+ člen (kontrola na webu) — DB povolí zápis přihlášenému, gate řeší appka.
-- Jména ukládáme denormalizovaně (profiles nejsou veřejné).
-- ============================================================

create table if not exists public.forum_threads (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid references auth.users(id) on delete set null,
  author_name  text,
  category     text not null default 'ostatni',
  title        text not null,
  body         text not null,
  pinned       boolean not null default false,
  hidden       boolean not null default false,
  reply_count  integer not null default 0,
  last_at      timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
create index if not exists forum_threads_cat_idx on public.forum_threads(category, last_at desc);

create table if not exists public.forum_posts (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.forum_threads(id) on delete cascade,
  author_id   uuid references auth.users(id) on delete set null,
  author_name text,
  body        text not null,
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists forum_posts_thread_idx on public.forum_posts(thread_id, created_at);

-- ---------- RLS ----------
alter table public.forum_threads enable row level security;
alter table public.forum_posts   enable row level security;

drop policy if exists forum_threads_read   on public.forum_threads;
drop policy if exists forum_threads_insert on public.forum_threads;
drop policy if exists forum_threads_modify on public.forum_threads;
create policy forum_threads_read on public.forum_threads for select
  using (not hidden or public.is_admin());
create policy forum_threads_insert on public.forum_threads for insert to authenticated
  with check (author_id = auth.uid());
create policy forum_threads_modify on public.forum_threads for all
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

drop policy if exists forum_posts_read   on public.forum_posts;
drop policy if exists forum_posts_insert on public.forum_posts;
drop policy if exists forum_posts_modify on public.forum_posts;
create policy forum_posts_read on public.forum_posts for select
  using (not hidden or public.is_admin());
create policy forum_posts_insert on public.forum_posts for insert to authenticated
  with check (author_id = auth.uid());
create policy forum_posts_modify on public.forum_posts for all
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

-- ---------- přepočet počtu odpovědí + poslední aktivity ----------
create or replace function public.forum_bump()
returns trigger language plpgsql security definer set search_path = public as $$
declare tid uuid;
begin
  tid := coalesce(new.thread_id, old.thread_id);
  update public.forum_threads t set
    reply_count = (select count(*) from public.forum_posts p where p.thread_id = tid and not p.hidden),
    last_at = greatest(t.created_at, coalesce((select max(p.created_at) from public.forum_posts p where p.thread_id = tid and not p.hidden), t.created_at))
  where t.id = tid;
  return coalesce(new, old);
end; $$;

drop trigger if exists trg_forum_bump on public.forum_posts;
create trigger trg_forum_bump after insert or update or delete on public.forum_posts
  for each row execute function public.forum_bump();

-- >>>>>>>>>>>>>>>>>>>> komunita.sql <<<<<<<<<<<<<<<<<<<<

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

-- >>>>>>>>>>>>>>>>>>>> overeni.sql <<<<<<<<<<<<<<<<<<<<

-- ============================================================
-- TenisHub — žádost o ověření (poskytovatelský model). Spustit PO schema/claimable.
-- Bezpečné opakovaně. Poskytovatel s HUB+ klikne „Chci ověření" → verify_requested=true;
-- admin ve frontě schválí (verified=true, verify_requested=false).
-- ============================================================
alter table public.specialists add column if not exists verify_requested boolean not null default false;
alter table public.venues      add column if not exists verify_requested boolean not null default false;

-- >>>>>>>>>>>>>>>>>>>> turnaje-import.sql <<<<<<<<<<<<<<<<<<<<

-- ============================================================
-- TenisHub — import turnajů jednotlivců ze cesky-tenis.cz (dedup).
-- Spustit PO komunita.sql. Bezpečné opakovaně.
-- ============================================================
alter table public.tournaments add column if not exists ext_id text;
create index if not exists tournaments_ext_idx on public.tournaments(ext_id);

-- >>>>>>>>>>>>>>>>>>>> notifikace.sql <<<<<<<<<<<<<<<<<<<<

-- ============================================================
-- TenisHub — e-mailové notifikace (značka, že už byl e-mail odeslán → bez duplicit).
-- Spustit PO forum.sql + komunita.sql + zpravy.sql. Bezpečné opakovaně.
-- ============================================================
alter table public.advice       add column if not exists notified_at timestamptz;
alter table public.forum_posts  add column if not exists notified_at timestamptz;
alter table public.messages     add column if not exists notified_at timestamptz;
