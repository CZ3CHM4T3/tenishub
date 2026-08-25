-- ============================================================
-- TenisHub — WAITLIST / předběžný přístup (zájemci o členství).
-- Kdo se zapíše do konce roku a koupí členství včas → trvalá zakládající cena 99.
-- Spustit v Supabase → SQL Editor. Bezpečné opakovaně.
-- ============================================================
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  note text,
  converted boolean not null default false,   -- už si koupil členství
  created_at timestamptz not null default now()
);
alter table public.waitlist enable row level security;

-- kdokoli (i nepřihlášený) může zapsat sebe
drop policy if exists waitlist_insert on public.waitlist;
create policy waitlist_insert on public.waitlist for insert to anon, authenticated with check (true);

-- číst a spravovat smí jen admin
drop policy if exists waitlist_admin_read on public.waitlist;
create policy waitlist_admin_read on public.waitlist for select using (public.is_admin());
drop policy if exists waitlist_admin_upd on public.waitlist;
create policy waitlist_admin_upd on public.waitlist for update using (public.is_admin());

create index if not exists waitlist_created_idx on public.waitlist(created_at desc);
