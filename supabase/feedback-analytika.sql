-- ============================================================
-- TenisHub — FEEDBACK DOTAZNÍK + KONVERZNÍ ANALYTIKA
-- Spustit v Supabase SQL Editoru, PO clenstvi.sql (kvůli is_admin()).
-- Bezpečné spustit i opakovaně.
--
-- feedback = krátká zpětná vazba od uživatelů (smí poslat kdokoli, čte admin).
-- events   = lehké záznamy návštěv (kind='visit') pro konverzní trychtýř
--            (návštěvy -> účty -> HUB+). Čte jen admin.
-- ============================================================

-- ---------- ZPĚTNÁ VAZBA ----------
create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  author_id   uuid references auth.users(id) on delete set null,
  author_name text,
  rating      int check (rating between 1 and 5),
  category    text,                 -- pochvala | chyba | napad | chybi | jine
  message     text not null,
  page        text,                 -- na které stránce ji poslal
  status      text not null default 'new'   -- new | read | archived
);
alter table public.feedback enable row level security;

-- poslat smí kdokoli (i nepřihlášený)
drop policy if exists feedback_insert on public.feedback;
create policy feedback_insert on public.feedback
  for insert with check (true);

-- číst a měnit smí jen admin
drop policy if exists feedback_admin_select on public.feedback;
create policy feedback_admin_select on public.feedback
  for select using (public.is_admin());
drop policy if exists feedback_admin_update on public.feedback;
create policy feedback_admin_update on public.feedback
  for update using (public.is_admin());
drop policy if exists feedback_admin_delete on public.feedback;
create policy feedback_admin_delete on public.feedback
  for delete using (public.is_admin());

create index if not exists feedback_created_idx on public.feedback (created_at desc);

-- ---------- NÁVŠTĚVY (konverzní trychtýř) ----------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  kind        text not null,        -- 'visit'
  path        text,
  session_id  text,                 -- náhodné ID prohlížeče (1 záznam / návštěva)
  profile_id  uuid references auth.users(id) on delete set null
);
alter table public.events enable row level security;

-- zapsat návštěvu smí kdokoli (i nepřihlášený)
drop policy if exists events_insert on public.events;
create policy events_insert on public.events
  for insert with check (true);

-- číst smí jen admin
drop policy if exists events_admin_select on public.events;
create policy events_admin_select on public.events
  for select using (public.is_admin());

create index if not exists events_created_idx on public.events (created_at desc);
create index if not exists events_kind_idx on public.events (kind);
