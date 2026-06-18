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
