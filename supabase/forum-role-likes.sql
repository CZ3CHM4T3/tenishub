-- ============================================================
-- TenisHub — FÓRUM v2: štítky rolí u autorů, lajky odpovědí, reakce na konkrétní
-- odpověď (parent_id). Spustit v Supabase SQL Editoru PO forum.sql. Bezpečné opakovaně.
-- ============================================================

-- Role autora (v době příspěvku) — admin / trenér / rodič+trenér / rodič.
create or replace function public.forum_role_for(p_uid uuid)
returns text language sql security definer stable set search_path = public as $$
  select case
    when coalesce((select is_admin from public.profiles where id = p_uid), false) then 'admin'
    when (coalesce((select is_coach from public.profiles where id = p_uid), false)
          or exists (select 1 from public.specialists where owner_id = p_uid))
         and exists (select 1 from public.cesta_players where owner_id = p_uid) then 'rodic_trener'
    when coalesce((select is_coach from public.profiles where id = p_uid), false)
          or exists (select 1 from public.specialists where owner_id = p_uid) then 'trener'
    else 'rodic'
  end;
$$;
grant execute on function public.forum_role_for(uuid) to authenticated, anon;

-- Denormalizovaný štítek role + reakce na konkrétní odpověď.
alter table public.forum_threads add column if not exists author_role text;
alter table public.forum_posts   add column if not exists author_role text;
alter table public.forum_posts   add column if not exists parent_id uuid references public.forum_posts(id) on delete cascade;
create index if not exists forum_posts_parent_idx on public.forum_posts(parent_id);

-- BEFORE INSERT trigger doplní author_role dle autora (appka nemusí nic počítat).
create or replace function public.forum_stamp_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.author_role is null and new.author_id is not null then
    new.author_role := public.forum_role_for(new.author_id);
  end if;
  return new;
end $$;
drop trigger if exists forum_threads_role on public.forum_threads;
create trigger forum_threads_role before insert on public.forum_threads
  for each row execute function public.forum_stamp_role();
drop trigger if exists forum_posts_role on public.forum_posts;
create trigger forum_posts_role before insert on public.forum_posts
  for each row execute function public.forum_stamp_role();

-- Doplnění role u již existujících příspěvků.
update public.forum_threads set author_role = public.forum_role_for(author_id) where author_role is null and author_id is not null;
update public.forum_posts   set author_role = public.forum_role_for(author_id) where author_role is null and author_id is not null;

-- LAJKY odpovědí.
create table if not exists public.forum_post_likes (
  post_id    uuid not null references public.forum_posts(id) on delete cascade,
  profile_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);
alter table public.forum_post_likes enable row level security;
drop policy if exists fpl_read on public.forum_post_likes;
create policy fpl_read on public.forum_post_likes for select using (true);
drop policy if exists fpl_own on public.forum_post_likes;
create policy fpl_own on public.forum_post_likes for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
grant select, insert, delete on public.forum_post_likes to authenticated;
grant select on public.forum_post_likes to anon;
