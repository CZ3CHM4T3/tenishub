-- ZDROJE — tipy na podcasty, články, videa a weby odjinud (kurátor = admin).
-- Message: nejsme jediný zdroj, brát info z víc míst je zdravé. Spustit v SQL Editoru.
create table if not exists public.zdroje (
  id uuid primary key default gen_random_uuid(),
  title      text not null,
  url        text not null,
  kind       text not null default 'web',   -- podcast | clanek | video | web | kniha
  note       text,
  created_at timestamptz not null default now()
);
alter table public.zdroje enable row level security;

drop policy if exists zdroje_read on public.zdroje;
create policy zdroje_read on public.zdroje for select using (true);

drop policy if exists zdroje_write on public.zdroje;
create policy zdroje_write on public.zdroje for all using (public.is_admin()) with check (public.is_admin());
