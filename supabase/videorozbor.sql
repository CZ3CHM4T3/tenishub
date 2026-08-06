-- ============================================================
-- TenisHub — VIDEOROZBOR (objednávky 1:1 rozboru z odkazu na video)
-- Spustit v Supabase SQL Editoru PO clenstvi.sql (kvůli is_admin()).
-- Bezpečné spustit i opakovaně.
-- Placená služba MIMO HUB+ — rodič vloží odkaz na video + kontakt, admin řeší ručně.
-- ============================================================

create table if not exists public.video_requests (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  author_id     uuid references auth.users(id) on delete set null,
  name          text not null,
  email         text not null,
  phone         text,
  player_age    text,                 -- volný text (věk / úroveň hráče)
  video_url     text not null,        -- odkaz YouTube / Disk / …
  note          text,                 -- co řešit
  preferred_at  text,                 -- preferovaný termín (volný text)
  status        text not null default 'new'   -- new | contacted | done | cancelled
);
alter table public.video_requests enable row level security;

-- objednat smí kdokoli (i nepřihlášený)
drop policy if exists video_requests_insert on public.video_requests;
create policy video_requests_insert on public.video_requests
  for insert with check (true);

-- číst a měnit smí jen admin
drop policy if exists video_requests_admin_select on public.video_requests;
create policy video_requests_admin_select on public.video_requests
  for select using (public.is_admin());
drop policy if exists video_requests_admin_update on public.video_requests;
create policy video_requests_admin_update on public.video_requests
  for update using (public.is_admin());
drop policy if exists video_requests_admin_delete on public.video_requests;
create policy video_requests_admin_delete on public.video_requests
  for delete using (public.is_admin());

create index if not exists video_requests_created_idx on public.video_requests (created_at desc);
