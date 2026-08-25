-- ============================================================
-- KONTAKT / „Zeptejte se nás" — dotazy od návštěvníků.
-- Spustit v Supabase SQL Editoru (po clenstvi.sql / admini.sql).
-- Zápis přes API route (server filtruje spam/sprostá slova + honeypot);
-- čte a spravuje jen admin. E-mail se pošle přes /api/notify (když je Resend).
-- ============================================================
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name       text,
  email      text,
  body       text not null,
  status     text not null default 'new',   -- new | read | spam
  created_at timestamptz not null default now(),
  meta       jsonb
);
alter table public.contact_messages enable row level security;

-- anonym smí vložit (API navíc filtruje); veřejně NIKDO nečte
drop policy if exists contact_insert on public.contact_messages;
create policy contact_insert on public.contact_messages for insert with check (true);

drop policy if exists contact_admin_read on public.contact_messages;
create policy contact_admin_read on public.contact_messages for select using (public.is_admin());

drop policy if exists contact_admin_update on public.contact_messages;
create policy contact_admin_update on public.contact_messages for update using (public.is_admin());

create index if not exists contact_created_idx on public.contact_messages(created_at desc);
