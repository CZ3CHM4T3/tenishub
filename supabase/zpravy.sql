-- ============================================================
-- TenisHub — INTERNÍ ZPRÁVY (chat hráč ↔ poskytovatel). Funkční bez plateb.
-- Spustit v Supabase SQL Editoru, PO RUN-ALL.sql. Bezpečné opakovaně.
-- POZN.: jména ukládáme do zprávy (profiles nejsou veřejně čitelné).
-- ============================================================

create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  from_id       uuid not null references public.profiles(id) on delete cascade,
  to_id         uuid not null references public.profiles(id) on delete cascade,
  from_name     text,                 -- jméno odesílatele (denormalizováno)
  to_name       text,                 -- jméno/název příjemce (kontext: koho oslovuji)
  specialist_id uuid references public.specialists(id) on delete set null,
  venue_id      uuid references public.venues(id) on delete set null,
  body          text not null,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists messages_to_idx   on public.messages(to_id, read_at);
create index if not exists messages_from_idx on public.messages(from_id);

alter table public.messages enable row level security;

drop policy if exists messages_read   on public.messages;
drop policy if exists messages_insert on public.messages;
drop policy if exists messages_update on public.messages;
create policy messages_read   on public.messages for select
  using (from_id = auth.uid() or to_id = auth.uid());
create policy messages_insert on public.messages for insert
  with check (from_id = auth.uid());
create policy messages_update on public.messages for update
  using (to_id = auth.uid());   -- příjemce smí označit jako přečtené
