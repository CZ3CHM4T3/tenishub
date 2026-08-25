-- KOMUNITA u článků „Vědět víc": lajky + komentáře (model à la Skool).
-- Číst může každý (SEO + komunita), lajkovat/komentovat přihlášený uživatel.
-- Spustit v Supabase SQL Editoru (po komunita.sql / clenstvi.sql / admini.sql).

-- LAJKY
create table if not exists public.article_likes (
  article_id uuid not null references public.articles(id) on delete cascade,
  profile_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, profile_id)
);
alter table public.article_likes enable row level security;
drop policy if exists alikes_read on public.article_likes;
create policy alikes_read on public.article_likes for select using (true);
drop policy if exists alikes_own on public.article_likes;
create policy alikes_own on public.article_likes for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- KOMENTÁŘE (jména denormalizovaná — profiles nejsou veřejné)
create table if not exists public.article_comments (
  id uuid primary key default gen_random_uuid(),
  article_id  uuid not null references public.articles(id) on delete cascade,
  author_id   uuid not null references auth.users(id) on delete cascade,
  author_name text,
  body        text not null,
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table public.article_comments enable row level security;
drop policy if exists acom_read on public.article_comments;
create policy acom_read on public.article_comments for select using (hidden = false or public.is_admin());
drop policy if exists acom_insert on public.article_comments;
create policy acom_insert on public.article_comments for insert to authenticated with check (author_id = auth.uid());
drop policy if exists acom_modify on public.article_comments;
create policy acom_modify on public.article_comments for all
  using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());
create index if not exists acom_article_idx on public.article_comments(article_id, created_at);
