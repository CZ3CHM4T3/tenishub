-- ============================================================
-- TenisHub — CLAIMABLE PROFILY (blank profil + převzetí + opt-out).
-- Spustit v Supabase SQL Editoru CELÉ najednou, PO clenstvi.sql + admini.sql.
-- Bezpečné spustit opakovaně.
--
-- Princip (GDPR-friendly adresář, jako Google Maps / Firmy.cz):
--   - specialists/venues mají stav: unclaimed | claimed | hidden
--   - unclaimed = "blank" neověřený profil (jen jméno, profese, město, odkaz)
--   - veřejně se NIKDY nezobrazují hidden (opt-out = okamžité skrytí)
--   - kontaktní údaje pro oslovení NEJSOU veřejné -> tabulka provider_outreach (jen admin)
--   - claim (převzetí) jde přes claim_requests -> schválí admin -> nastaví owner_id
--   - removal_requests = opt-out, může poslat KDOKOLI (i nepřihlášený / bez účtu)
-- ============================================================

-- ---------- STAV PROFILŮ ----------
alter table public.specialists add column if not exists status text not null default 'claimed';
alter table public.venues      add column if not exists status text not null default 'claimed';
alter table public.specialists add column if not exists source text;   -- odkud data (např. URL/poznámka)
alter table public.venues      add column if not exists source text;

do $$ begin
  alter table public.specialists add constraint specialists_status_chk
    check (status in ('unclaimed','claimed','hidden'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.venues add constraint venues_status_chk
    check (status in ('unclaimed','claimed','hidden'));
exception when duplicate_object then null; end $$;

-- ---------- ČTENÍ: skrýt 'hidden' před veřejností (admin vidí vše) ----------
drop policy if exists specialists_read on public.specialists;
create policy specialists_read on public.specialists for select
  using (status <> 'hidden' or public.is_admin());

drop policy if exists venues_read on public.venues;
create policy venues_read on public.venues for select
  using (status <> 'hidden' or public.is_admin());

-- Admin smí upravovat/skrývat jakýkoli profil (vedle vlastníka).
drop policy if exists specialists_write on public.specialists;
create policy specialists_write on public.specialists for all
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists venues_write on public.venues;
create policy venues_write on public.venues for all
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

-- ============================================================
-- OUTREACH: kontakty pro postupné oslovování (POUZE ADMIN, neveřejné)
-- ============================================================
create table if not exists public.provider_outreach (
  id            uuid primary key default gen_random_uuid(),
  specialist_id uuid references public.specialists(id) on delete cascade,
  venue_id      uuid references public.venues(id) on delete cascade,
  email         text,
  phone         text,
  source_url    text,                       -- kde jsme to veřejně našli (doložení oprávněného zájmu)
  note          text,
  status        text not null default 'new', -- new | contacted | claimed | declined
  contacted_at  timestamptz,
  created_at    timestamptz not null default now(),
  check ( (specialist_id is not null)::int + (venue_id is not null)::int = 1 )
);
alter table public.provider_outreach enable row level security;
drop policy if exists outreach_admin on public.provider_outreach;
create policy outreach_admin on public.provider_outreach for all
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- CLAIM: "Tohle jsem já — převzít profil" (schvaluje admin)
-- ============================================================
create table if not exists public.claim_requests (
  id            uuid primary key default gen_random_uuid(),
  specialist_id uuid references public.specialists(id) on delete cascade,
  venue_id      uuid references public.venues(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  message       text,
  status        text not null default 'pending', -- pending | approved | rejected
  created_at    timestamptz not null default now(),
  check ( (specialist_id is not null)::int + (venue_id is not null)::int = 1 )
);
alter table public.claim_requests enable row level security;
drop policy if exists claim_read   on public.claim_requests;
drop policy if exists claim_insert on public.claim_requests;
drop policy if exists claim_update on public.claim_requests;
create policy claim_read   on public.claim_requests for select
  using (user_id = auth.uid() or public.is_admin());
create policy claim_insert on public.claim_requests for insert
  with check (user_id = auth.uid());
create policy claim_update on public.claim_requests for update
  using (public.is_admin());

-- Admin schválí žádost: nastaví owner_id + status='claimed' a žádost approved.
create or replace function public.approve_claim(claim_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare c public.claim_requests;
begin
  if not public.is_admin() then raise exception 'jen admin'; end if;
  select * into c from public.claim_requests where id = claim_id;
  if c.specialist_id is not null then
    update public.specialists set owner_id = c.user_id, status = 'claimed', verified = true
      where id = c.specialist_id;
  else
    update public.venues set owner_id = c.user_id, status = 'claimed', verified = true
      where id = c.venue_id;
  end if;
  update public.claim_requests set status = 'approved' where id = claim_id;
end; $$;

-- ============================================================
-- OPT-OUT: "Nechci tu být / odstranit" — smí poslat KDOKOLI (i bez účtu)
-- ============================================================
create table if not exists public.removal_requests (
  id            uuid primary key default gen_random_uuid(),
  specialist_id uuid references public.specialists(id) on delete cascade,
  venue_id      uuid references public.venues(id) on delete cascade,
  email         text,
  reason        text,
  status        text not null default 'open',   -- open | done
  created_at    timestamptz not null default now()
);
alter table public.removal_requests enable row level security;
drop policy if exists removal_insert on public.removal_requests;
drop policy if exists removal_read   on public.removal_requests;
drop policy if exists removal_update on public.removal_requests;
-- insert smí i anon (nepřihlášený) — opt-out musí být bezbariérový
create policy removal_insert on public.removal_requests for insert with check (true);
create policy removal_read   on public.removal_requests for select using (public.is_admin());
create policy removal_update on public.removal_requests for update using (public.is_admin());

-- Admin vyřídí opt-out: skryje profil + uzavře žádost.
create or replace function public.resolve_removal(req_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r public.removal_requests;
begin
  if not public.is_admin() then raise exception 'jen admin'; end if;
  select * into r from public.removal_requests where id = req_id;
  if r.specialist_id is not null then
    update public.specialists set status = 'hidden' where id = r.specialist_id;
  else
    update public.venues set status = 'hidden' where id = r.venue_id;
  end if;
  update public.removal_requests set status = 'done' where id = req_id;
end; $$;
