-- ============================================================
-- TenisHub — RUN-EVERYTHING.sql  (VŠECHNO V JEDNOM)
-- ------------------------------------------------------------
-- Spustit v Supabase: SQL Editor -> New query -> vložit CELÉ -> Run.
-- Vše je IDEMPOTENTNÍ = bezpečné spustit i opakovaně.
-- Pokud uvidíš hlášky typu "already exists" / "does not exist" u DROP,
-- nevadí — znamená to, že daná část už byla hotová. Důležitý je výsledek.
-- Pořadí sekcí respektuje závislosti, NEPŘEHAZOVAT.
-- ============================================================



-- ████████████████████████████████████████████████████████████
-- ██ SEKCE 1/12:  schema.sql
-- ██ Základ: tabulky, RLS, ukázková data
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- TenisHub — SQL schéma, FÁZE 1
-- Spustit v Supabase: SQL Editor → New query → vložit celé → Run.
-- Bezpečné spustit i opakovaně (IF NOT EXISTS / drop policy if exists).
-- ============================================================

-- ---------- ENUMS ----------
do $$ begin
  create type service_kind as enum ('coach', 'physio', 'fitness', 'academy');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('pending', 'paid', 'cancelled');
exception when duplicate_object then null; end $$;

-- ============================================================
-- PROFILY (navazují na auth.users)
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text default 'parent',   -- parent | player | coach | venue | physio | fitness | academy
  city        text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- automatické založení profilu po registraci
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- SPECIALISTÉ (trenér / fyzio / fitness / akademie) — body na mapě
-- ============================================================
create table if not exists public.specialists (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references public.profiles(id) on delete set null,
  kind          service_kind not null,
  name          text not null,
  bio           text,
  city          text,
  lat           double precision,
  lng           double precision,
  phone         text,
  email         text,
  website       text,
  price_from    int,               -- orientační cena od (Kč)
  verified      boolean not null default false,
  rating        numeric(2,1) not null default 0,
  reviews_count int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists specialists_kind_idx on public.specialists(kind);
create index if not exists specialists_city_idx on public.specialists(city);

-- ceník / nabízené lekce specialisty
create table if not exists public.services (
  id            uuid primary key default gen_random_uuid(),
  specialist_id uuid not null references public.specialists(id) on delete cascade,
  name          text not null,
  price_czk     int not null,
  duration_min  int not null default 55,
  capacity      int not null default 1
);

-- ============================================================
-- AREÁLY a KURTY
-- ============================================================
create table if not exists public.venues (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references public.profiles(id) on delete set null,
  name          text not null,
  city          text,
  lat           double precision,
  lng           double precision,
  description   text,
  amenities     text[],
  verified      boolean not null default false,
  rating        numeric(2,1) not null default 0,
  reviews_count int not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.courts (
  id        uuid primary key default gen_random_uuid(),
  venue_id  uuid not null references public.venues(id) on delete cascade,
  name      text not null,
  indoor    boolean not null default false,
  surface   text
);

-- ============================================================
-- RECENZE (na specialistu nebo areál)
-- ============================================================
create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  specialist_id uuid references public.specialists(id) on delete cascade,
  venue_id      uuid references public.venues(id) on delete cascade,
  author_id     uuid references public.profiles(id) on delete set null,
  rating        int not null check (rating between 1 and 5),
  body          text,
  created_at    timestamptz not null default now(),
  check ( (specialist_id is not null)::int + (venue_id is not null)::int = 1 )
);

-- ============================================================
-- SPARRING — nabídky parťáků na hru
-- ============================================================
create table if not exists public.sparring_offers (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  level       text,            -- např. "hobby", "II. třída", "závodní"
  city        text,
  lat         double precision,
  lng         double precision,
  availability text,
  note        text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- REZERVACE (lekce u specialisty / kurt v areálu)
-- ============================================================
create table if not exists public.bookings (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid references public.profiles(id) on delete set null,
  specialist_id uuid references public.specialists(id) on delete set null,
  court_id      uuid references public.courts(id) on delete set null,
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  price_czk     int,
  status        booking_status not null default 'pending',
  payment_ref   text,
  created_at    timestamptz not null default now()
);
create index if not exists bookings_customer_idx on public.bookings(customer_id);

-- ============================================================
-- RLS (Row Level Security)
--   Čtení = veřejné (mapa a profily musí vidět i nepřihlášení).
--   Zápis = jen vlastník daného záznamu.
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.specialists     enable row level security;
alter table public.services        enable row level security;
alter table public.venues          enable row level security;
alter table public.courts          enable row level security;
alter table public.reviews         enable row level security;
alter table public.sparring_offers enable row level security;
alter table public.bookings        enable row level security;

-- PROFILES
drop policy if exists profiles_read   on public.profiles;
drop policy if exists profiles_write  on public.profiles;
create policy profiles_read  on public.profiles for select using (true);
create policy profiles_write on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

-- SPECIALISTS
drop policy if exists specialists_read  on public.specialists;
drop policy if exists specialists_write on public.specialists;
create policy specialists_read  on public.specialists for select using (true);
create policy specialists_write on public.specialists for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- SERVICES (přes vlastníka specialisty)
drop policy if exists services_read  on public.services;
drop policy if exists services_write on public.services;
create policy services_read  on public.services for select using (true);
create policy services_write on public.services for all
  using (specialist_id in (select id from public.specialists where owner_id = auth.uid()))
  with check (specialist_id in (select id from public.specialists where owner_id = auth.uid()));

-- VENUES
drop policy if exists venues_read  on public.venues;
drop policy if exists venues_write on public.venues;
create policy venues_read  on public.venues for select using (true);
create policy venues_write on public.venues for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- COURTS (přes vlastníka areálu)
drop policy if exists courts_read  on public.courts;
drop policy if exists courts_write on public.courts;
create policy courts_read  on public.courts for select using (true);
create policy courts_write on public.courts for all
  using (venue_id in (select id from public.venues where owner_id = auth.uid()))
  with check (venue_id in (select id from public.venues where owner_id = auth.uid()));

-- REVIEWS
drop policy if exists reviews_read   on public.reviews;
drop policy if exists reviews_insert on public.reviews;
drop policy if exists reviews_modify on public.reviews;
create policy reviews_read   on public.reviews for select using (true);
create policy reviews_insert on public.reviews for insert with check (author_id = auth.uid());
create policy reviews_modify on public.reviews for update using (author_id = auth.uid());

-- SPARRING
drop policy if exists sparring_read  on public.sparring_offers;
drop policy if exists sparring_write on public.sparring_offers;
create policy sparring_read  on public.sparring_offers for select using (true);
create policy sparring_write on public.sparring_offers for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- BOOKINGS (vidí zákazník i majitel služby; zakládá zákazník)
drop policy if exists bookings_read   on public.bookings;
drop policy if exists bookings_insert on public.bookings;
drop policy if exists bookings_update on public.bookings;
create policy bookings_read on public.bookings for select using (
  customer_id = auth.uid()
  or specialist_id in (select id from public.specialists where owner_id = auth.uid())
  or court_id in (select c.id from public.courts c join public.venues v on v.id = c.venue_id where v.owner_id = auth.uid())
);
create policy bookings_insert on public.bookings for insert with check (customer_id = auth.uid());
create policy bookings_update on public.bookings for update using (
  customer_id = auth.uid()
  or specialist_id in (select id from public.specialists where owner_id = auth.uid())
);

-- ============================================================
-- UKÁZKOVÁ DATA (ať mapa hned něco ukáže). Klidně smaž později.
-- ============================================================
insert into public.specialists (kind, name, bio, city, lat, lng, price_from, verified, rating, reviews_count) values
  ('coach',   'Jiří Novák',        'Trenér dětí i dospělých, Praha 6.',        'Praha',            50.0880, 14.3950, 500, true,  4.9, 37),
  ('coach',   'Petra Malá',        'Specializace na techniku úderů.',          'Brno',             49.2050, 16.6300, 450, true,  4.7, 21),
  ('physio',  'Fyzio Centrum',     'Rehabilitace a prevence zranění tenistů.', 'Praha',            50.0650, 14.4500, 700, true,  4.8, 12),
  ('fitness', 'Martin Beneš',      'Kondiční příprava pro tenisty.',           'Plzeň',            49.7480, 13.3870, 600, false, 4.6, 8),
  ('academy', 'Akademie Smash',    'Tenisová škola pro děti a mládež.',        'Olomouc',          49.5950, 17.2510, 0,   true,  4.8, 15),
  ('coach',   'David Urban',       'Dospělí hobby hráči, flexibilní termíny.', 'Ostrava',          49.8350, 18.2920, 400, false, 4.5, 6),
  ('physio',  'Eva Králová',       'Fyzioterapie zaměřená na rameno a loket.', 'Hradec Králové',   50.2100, 15.8330, 650, true,  4.9, 9),
  ('fitness', 'Kondice Liberec',   'Skupinová i individuální kondice.',        'Liberec',          50.7700, 15.0560, 350, false, 4.4, 5)
on conflict do nothing;

insert into public.venues (name, city, lat, lng, description, amenities, verified, rating, reviews_count) values
  ('TK Sokol Dobřichovice', 'Praha',   49.9270, 14.2780, '4 antukové kurty, 1 krytý.', array['antuka','šatny','bar'],      true,  4.7, 18),
  ('Areál Na Kurtech',      'Brno',    49.1900, 16.6100, 'Moderní areál s halou.',     array['hala','antuka','parkování'], true,  4.6, 11),
  ('Klub LTC',              'Plzeň',   49.7450, 13.3700, 'Tradiční klub, 6 kurtů.',    array['antuka','restaurace'],       false, 4.5, 7)
on conflict do nothing;


-- ████████████████████████████████████████████████████████████
-- ██ SEKCE 2/12:  clenstvi.sql
-- ██ Členství HUB+, is_admin(), profily neveřejné
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- TenisHub — ČLENSTVÍ (HUB+) + ADMIN. Spustit v Supabase SQL Editoru
-- (celé najednou, PO schema.sql). Bezpečné spustit opakovaně.
-- ============================================================

-- profily: admin flag + e-mail (pro admin přehled)
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists email text;

-- trigger po registraci ukládá i e-mail
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end; $$;

-- pomocná funkce: je přihlášený uživatel admin? (security definer kvůli RLS)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- ============================================================
-- ČLENSTVÍ
-- ============================================================
create table if not exists public.memberships (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  plan        text not null default 'hubplus',
  status      text not null default 'active',          -- active | cancelled
  started_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  auto_renew  boolean not null default true,
  price_czk   int not null default 200,
  created_at  timestamptz not null default now()
);
create index if not exists memberships_profile_idx on public.memberships(profile_id);

alter table public.memberships enable row level security;

drop policy if exists memberships_read   on public.memberships;
drop policy if exists memberships_insert on public.memberships;
drop policy if exists memberships_update on public.memberships;
create policy memberships_read on public.memberships for select
  using (profile_id = auth.uid() or public.is_admin());
create policy memberships_insert on public.memberships for insert
  with check (profile_id = auth.uid() or public.is_admin());
create policy memberships_update on public.memberships for update
  using (profile_id = auth.uid() or public.is_admin());

-- ============================================================
-- SOUKROMÍ: profily už NEČÍST veřejně (jsou tam e-maily).
-- Každý vidí svůj profil, admin vidí všechny.
-- ============================================================
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select
  using (id = auth.uid() or public.is_admin());

-- ============================================================
-- ADMIN = JAN: po své registraci na webu spusť s tvým e-mailem:
-- update public.profiles set is_admin = true
--   where id in (select id from auth.users where email = 'TVUJ@EMAIL.CZ');
-- ============================================================


-- ████████████████████████████████████████████████████████████
-- ██ SEKCE 3/12:  admini.sql
-- ██ Auto-admini (Jan+Jirka), admin vidí bookings
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- TenisHub — ADMINI (Jan + Jirka) a admin přístup k platbám.
-- Spustit v Supabase SQL Editoru celé najednou (PO clenstvi.sql).
-- ============================================================

-- 1) Admin e-maily: kdo se registruje těmito maily, je automaticky admin.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    lower(new.email) in ('schroffelh@seznam.cz', 'machekjirka@gmail.com')
  )
  on conflict (id) do update
    set email = excluded.email,
        is_admin = excluded.is_admin or public.profiles.is_admin;
  return new;
end; $$;

-- 2) A rovnou nastavit adminy i pro UŽ existující účty s těmito maily:
update public.profiles set is_admin = true
  where id in (select id from auth.users where lower(email) in ('schroffelh@seznam.cz', 'machekjirka@gmail.com'));

-- 3) Admin vidí všechny rezervace/platby (kvůli přehledu v administraci):
drop policy if exists bookings_read on public.bookings;
create policy bookings_read on public.bookings for select using (
  customer_id = auth.uid()
  or specialist_id in (select id from public.specialists where owner_id = auth.uid())
  or court_id in (select c.id from public.courts c join public.venues v on v.id = c.venue_id where v.owner_id = auth.uid())
  or public.is_admin()
);


-- ████████████████████████████████████████████████████████████
-- ██ SEKCE 4/12:  recenze-sparring.sql
-- ██ author_name v recenzích/sparringu + přepočet ratingu
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- TenisHub — RECENZE + SPARRING (doplnění). Spustit PO schema.sql.
-- Bezpečné spustit opakovaně.
-- ============================================================

-- Jméno autora denormalizovaně (profiles už nejsou veřejně čitelné kvůli e-mailům,
-- tak si jméno uložíme přímo k recenzi/inzerátu pro veřejné zobrazení).
alter table public.reviews          add column if not exists author_name text;
alter table public.sparring_offers  add column if not exists author_name text;

-- Recenze smí přidat každý přihlášený (na svoje jméno).
drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews for insert
  with check (author_id = auth.uid());

-- Po vložení/smazání recenze přepočítat hodnocení a počet u specialisty.
create or replace function public.recompute_specialist_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  sid := coalesce(new.specialist_id, old.specialist_id);
  if sid is not null then
    update public.specialists s set
      rating = coalesce((select round(avg(rating)::numeric, 1) from public.reviews where specialist_id = sid), 0),
      reviews_count = (select count(*) from public.reviews where specialist_id = sid)
    where s.id = sid;
  end if;
  return null;
end; $$;

drop trigger if exists reviews_recompute on public.reviews;
create trigger reviews_recompute
  after insert or delete on public.reviews
  for each row execute function public.recompute_specialist_rating();


-- ████████████████████████████████████████████████████████████
-- ██ SEKCE 5/12:  RUN-ALL.sql
-- ██ Claimable profily + REÁLNÁ DATA (trenéři, kluby, školy) + úklid dema
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- TenisHub — VŠECHNO DOHROMADY (spustit v Supabase SQL Editoru najednou)
-- Spustit PO schema.sql + clenstvi.sql + admini.sql (+ recenze-sparring.sql).
-- Pořadí: claimable -> unclaimed-providers -> trainers -> cleanup-demo.
-- Bezpečné spustit i opakovaně.
-- ============================================================


-- ##### 1/4 claimable.sql #####
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


-- ##### 2/4 unclaimed-providers.sql #####
-- ============================================================
-- TenisHub — NEOVĚŘENÉ ("blank") PROFILY z veřejných adresářů.
-- Spustit v Supabase SQL Editoru, PO claimable.sql. Bezpečné opakovaně
-- (vkládá jen to, co ještě není – párováno přes jméno).
--
-- Princip:
--   - VEŘEJNĚ jen jméno + typ + město + případně veřejný web (status='unclaimed').
--   - Kontakt (e-mail/telefon) NENÍ veřejný → jde do provider_outreach (vidí jen admin),
--     slouží k postupnému oslovení. U každého je source_url = kde jsme to veřejně našli.
--   - Zdroj: veřejný adresář trenérů vaseliga.cz + vlastní veřejné weby trenérů.
--   - Každý si profil může převzít ("Tohle jsem já") nebo nechat skrýt ("Nahlásit/odstranit").
-- ============================================================

-- 1) VEŘEJNÁ ČÁST: specialists (jen pokud stejné jméno ještě není)
insert into public.specialists (kind, name, city, lat, lng, status, source, website, verified, rating, reviews_count)
select v.kind::service_kind, v.name, v.city, v.lat, v.lng, 'unclaimed', v.source, v.website, false, 0, 0
from (values
  -- PRAHA (zdroj: vaseliga.cz/treneri/tenis/praha)
  ('coach',   'Ing. Filip Fikejz',     'Praha',          50.0830, 14.4200, 'vaseliga.cz', null),
  ('coach',   'Martin Demuth',         'Praha',          50.0700, 14.4520, 'vaseliga.cz', null),
  ('coach',   'Ing. Petr Pröschl',     'Praha',          50.0855, 14.4920, 'vaseliga.cz', 'www.vyukatenisupraha.cz'),
  ('coach',   'Krystyna Sumtsová',     'Praha',          50.1230, 14.4100, 'vaseliga.cz', null),
  ('coach',   'Ing. Tomáš Linhart',    'Praha',          50.0905, 14.4710, 'vaseliga.cz', 'www.setbol.cz'),
  ('coach',   'Petra Reinerová',       'Praha',          50.0610, 14.4020, 'vaseliga.cz', null),
  ('coach',   'Jan Kresl',             'Praha',          50.0500, 14.4350, 'vaseliga.cz', null),
  ('coach',   'Marek Benda',           'Praha',          50.0420, 14.4460, 'vaseliga.cz', null),
  ('coach',   'Olivia Zídková',        'Praha',          50.0540, 14.4640, 'vaseliga.cz', null),
  ('academy', 'Tenisová škola ESO',    'Praha',          50.1300, 14.4720, 'vaseliga.cz', 'www.tseso.cz'),
  ('academy', 'Tenis Xaverov',         'Praha',          50.1010, 14.6200, 'vaseliga.cz', 'www.tenisxaverov.cz'),
  ('coach',   'Kryštof Klápa',         'Praha',          50.0790, 14.4010, 'krystofklapa.com', 'www.krystofklapa.com'),
  ('academy', 'Tenisová škola TIM',    'Praha',          50.0720, 14.5010, 'tenisovaskolatim.cz', 'tenisovaskolatim.cz'),
  -- BRNO (zdroj: vaseliga.cz/treneri/tenis/brno)
  ('coach',   'Aneta Šmerdová',        'Brno',           49.1951, 16.6068, 'vaseliga.cz', null),
  ('coach',   'Bc. Matyáš Bartoň',     'Brno',           49.2010, 16.6120, 'vaseliga.cz', 'www.trenertenisu-brno.cz'),
  -- PLZEŇ (zdroj: vaseliga.cz/treneri/tenis/plzen)
  ('coach',   'Petr Trojáček',         'Plzeň',          49.7475, 13.3776, 'vaseliga.cz', 'www.extratenis.cz'),
  -- HRADEC KRÁLOVÉ (zdroj: vaseliga.cz/treneri/tenis/hradec-kralove)
  ('coach',   'Tomáš Adámek',          'Hradec Králové', 50.2092, 15.8328, 'vaseliga.cz', null)
) as v(kind, name, city, lat, lng, source, website)
where not exists (select 1 from public.specialists s where s.name = v.name);

-- 2) NEVEŘEJNÁ ČÁST: kontakty pro oslovení (jen admin) + doložení zdroje
insert into public.provider_outreach (specialist_id, email, phone, source_url, note)
select s.id, c.email, c.phone, c.source_url, 'import z veřejného adresáře'
from (values
  ('Ing. Filip Fikejz',  'filipfikejz@atlas.cz',        null,          'https://m.vaseliga.cz/treneri/tenis/praha'),
  ('Martin Demuth',      'martindemuth@seznam.cz',      null,          'https://m.vaseliga.cz/treneri/tenis/praha'),
  ('Krystyna Sumtsová',  'Sumtsova@seznam.cz',          null,          'https://m.vaseliga.cz/treneri/tenis/praha'),
  ('Petra Reinerová',    'siler15@seznam.cz',           null,          'https://m.vaseliga.cz/treneri/tenis/praha'),
  ('Jan Kresl',          'jkteniscoach@email.cz',       null,          'https://m.vaseliga.cz/treneri/tenis/praha'),
  ('Marek Benda',        'bendamarek98@seznam.cz',      null,          'https://m.vaseliga.cz/treneri/tenis/praha'),
  ('Olivia Zídková',     'ozidkova@email.cz',           null,          'https://m.vaseliga.cz/treneri/tenis/praha'),
  ('Tenisová škola TIM', 'tenisovaskolatim@email.cz',   null,          'https://tenisovaskolatim.cz/'),
  ('Aneta Šmerdová',     'aneta.smerdova@gmail.com',    null,          'https://m.vaseliga.cz/treneri/tenis/brno'),
  ('Bc. Matyáš Bartoň',  'maty.barton@seznam.cz',       null,          'https://m.vaseliga.cz/treneri/tenis/brno'),
  ('Petr Trojáček',      'petr.trojacek@gmail.com',     '+420777650909','https://m.vaseliga.cz/treneri/tenis/plzen'),
  ('Tomáš Adámek',       'TomAda@seznam.cz',            '+420721769432','https://m.vaseliga.cz/treneri/tenis/hradec-kralove')
) as c(name, email, phone, source_url)
join public.specialists s on s.name = c.name
where not exists (select 1 from public.provider_outreach o where o.specialist_id = s.id);

-- ============================================================
-- 3) FYZIO (kind=physio) — sportovní fyzioterapie pro tenisty (veřejné weby)
-- ============================================================
insert into public.specialists (kind, name, city, lat, lng, status, source, website, verified, rating, reviews_count)
select 'physio'::service_kind, v.name, v.city, v.lat, v.lng, 'unclaimed', v.source, v.website, false, 0, 0
from (values
  ('BeTu Rehab Vinohrady',          'Praha', 50.0780, 14.4480, 'betu.cz',       'www.betu.cz'),
  ('Rehazone',                      'Praha', 50.0820, 14.4500, 'rehazone.cz',   'www.rehazone.cz'),
  ('MY CLINIC – sportovní medicína','Praha', 50.0520, 14.4300, 'myclinic.cz',   'www.myclinic.cz'),
  ('SportRehab.cz',                 'Praha', 50.0010, 14.4100, 'sportrehab.cz', 'www.sportrehab.cz'),
  ('Alltraining.cz – fyzioterapie', 'Praha', 50.0850, 14.4300, 'alltraining.cz','www.alltraining.cz')
) as v(name, city, lat, lng, source, website)
where not exists (select 1 from public.specialists s where s.name = v.name);

-- ============================================================
-- 4) AREÁLY / KLUBY (venues) — reálné tenisové kluby z veřejných webů
--    (souřadnice jsou přibližné podle města/čtvrti — upřesní se po převzetí)
-- ============================================================
alter table public.venues add column if not exists website text;

insert into public.venues (name, city, lat, lng, status, source, website, verified, rating, reviews_count)
select v.name, v.city, v.lat, v.lng, 'unclaimed', v.source, v.website, false, 0, 0
from (values
  ('I. ČLTK Praha',                'Praha',        50.0940, 14.4440, 'cltk.cz',          'www.cltk.cz'),
  ('TK Konstruktiva Praha',        'Praha',        50.0300, 14.4300, 'tkk.cz',           'www.tkk.cz'),
  ('TC Brno',                      'Brno',         49.2000, 16.5900, 'tc-brno.cz',       'www.tc-brno.cz'),
  ('ŽLTC Brno',                    'Brno',         49.1900, 16.5800, 'zltc.cz',          'zltc.cz'),
  ('TK Tesla Brno',                'Brno',         49.2300, 16.5900, 'teslabrno.cz',     'www.teslabrno.cz'),
  ('Bystrcký tenisový klub Brno',  'Brno',         49.2200, 16.5200, 'btkbrno.cz',       'www.btkbrno.cz'),
  ('TJ Ostrava – tenis',           'Ostrava',      49.8380, 18.2850, 'tjostrava.cz',     'www.tjostrava.cz'),
  ('TJ Baník Ostrava – tenis',     'Ostrava',      49.8420, 18.2900, 'baniktenis.cz',    'www.baniktenis.cz'),
  ('TK MILO Olomouc',              'Olomouc',      49.5900, 17.2700, 'tkmilo.cz',        'www.tkmilo.cz'),
  ('ČLTK 1928 Olomouc',            'Olomouc',      49.5900, 17.2500, 'cltk1928.com',     'www.cltk1928.com'),
  ('OMEGASPORT Olomouc',           'Olomouc',      49.5800, 17.2800, 'omegasport.cz',    'www.omegasport.cz'),
  ('Tenisová hala Samotišky',      'Olomouc',      49.6200, 17.3100, 'samotisky.cz',     'www.samotisky.cz'),
  ('TJ Lokomotiva Plzeň – tenis',  'Plzeň',        49.7400, 13.3900, 'tkloko.cz',        'www.tkloko.cz'),
  ('TK Slavia Plzeň',              'Plzeň',        49.7400, 13.3700, 'tkslaviaplzen.cz', 'tkslaviaplzen.cz'),
  ('I. ČLTK Plzeň',                'Plzeň',        49.7500, 13.3800, 'cltkplzen.cz',     'www.cltkplzen.cz'),
  ('Tenisový klub Liberec',        'Liberec',      50.7700, 15.0600, 'tenis-liberec.cz', 'www.tenis-liberec.cz'),
  ('TK Rapid Liberec',             'Liberec',      50.7600, 15.0500, 'tkrapid.cz',       'www.tkrapid.cz'),
  ('LTK Liberec',                  'Liberec',      50.7700, 15.0700, 'ltkliberec.cz',    'www.ltkliberec.cz'),
  ('Tenis Nisa Liberec',           'Liberec',      50.7680, 15.0580, 'tenisnisa.cz',     'tenisnisa.cz'),
  ('TJ Sokol Dobřichovice – tenis','Dobřichovice', 49.9270, 14.2790, 'web',              null)
) as v(name, city, lat, lng, source, website)
where not exists (select 1 from public.venues vv where vv.name = v.name);

-- ============================================================
-- 5) TENISOVÉ ŠKOLY / TRENÉŘI (kind=academy) — celá ČR, veřejné weby
-- ============================================================
insert into public.specialists (kind, name, city, lat, lng, status, source, website, verified, rating, reviews_count)
select 'academy'::service_kind, v.name, v.city, v.lat, v.lng, 'unclaimed', v.source, v.website, false, 0, 0
from (values
  ('Tenisová škola SPIN',                  'Ostrava',  49.8400, 18.2900, 'tenisovaskolaspin.cz', 'www.tenisovaskolaspin.cz'),
  ('SH Tennis Team',                       'Ostrava',  49.8250, 18.2000, 'shtennisteam.com',     'www.shtennisteam.com'),
  ('Junior Tennis Ostrava',                'Ostrava',  49.8350, 18.2700, 'juniortennis.cz',      'juniortennis.cz'),
  ('TJ Sokol Stará Bělá – tenis',          'Ostrava',  49.7800, 18.3200, 'starabelatenis.cz',    'www.starabelatenis.cz'),
  ('Tenisová škola Olomouc Svoboda & Zbořil','Olomouc',49.5900, 17.2600, 'tenisolomouc.com',     'www.tenisolomouc.com'),
  ('MTenis sport Teplice',                 'Teplice',  50.6400, 13.8300, 'mtenissport.cz',       'mtenissport.cz'),
  ('Tenisová škola Jihlava',               'Jihlava',  49.4000, 15.5900, 'tenis-jihlava.cz',     'www.tenis-jihlava.cz'),
  ('Tenisová školička Žďár nad Sázavou',   'Žďár nad Sázavou', 49.5630, 15.9400, 'tenis-zdar.cz','www.tenis-zdar.cz')
) as v(name, city, lat, lng, source, website)
where not exists (select 1 from public.specialists s where s.name = v.name);

-- ============================================================
-- 6) DALŠÍ SPORTOVNÍ FYZIO (kind=physio) — Brno a okolí
-- ============================================================
insert into public.specialists (kind, name, city, lat, lng, status, source, website, verified, rating, reviews_count)
select 'physio'::service_kind, v.name, v.city, v.lat, v.lng, 'unclaimed', v.source, v.website, false, 0, 0
from (values
  ('Sportovní fyzioterapie Brno (SF3)',    'Brno',  49.2000, 16.6100, 'sf3.cz',                 'www.sf3.cz'),
  ('Mgr. Vít Císař – sportovní fyzioterapie','Brno',49.2100, 16.6000, 'sportfyzioterapie.cz',   'www.sportfyzioterapie.cz'),
  ('Rehabilitace Koutný Brno',             'Brno',  49.2200, 16.5900, 'rehabilitacekoutny.cz',  'www.rehabilitacekoutny.cz'),
  ('Physio Suchánek Brno',                 'Brno',  49.1900, 16.6100, 'physiosuchanek.cz',      'www.physiosuchanek.cz'),
  ('Klinika sportovní medicíny Praha',     'Praha', 50.1000, 14.5000, 'sportovnimedicina.cz',   'www.sportovnimedicina.cz')
) as v(name, city, lat, lng, source, website)
where not exists (select 1 from public.specialists s where s.name = v.name);

-- ============================================================
-- 7) FITNESS / KONDIČNÍ PŘÍPRAVA (kind=fitness)
-- ============================================================
insert into public.specialists (kind, name, city, lat, lng, status, source, website, verified, rating, reviews_count)
select 'fitness'::service_kind, v.name, v.city, v.lat, v.lng, 'unclaimed', v.source, v.website, false, 0, 0
from (values
  ('Strange Training Brno',                'Brno',  49.1900, 16.6100, 'strangetraining.cz', 'strangetraining.cz')
) as v(name, city, lat, lng, source, website)
where not exists (select 1 from public.specialists s where s.name = v.name);

-- ============================================================
-- 8) DALŠÍ AREÁLY / KLUBY (venues) — zbytek krajů ČR
-- ============================================================
insert into public.venues (name, city, lat, lng, status, source, website, verified, rating, reviews_count)
select v.name, v.city, v.lat, v.lng, 'unclaimed', v.source, v.website, false, 0, 0
from (values
  -- Hradec Králové
  ('Teniscentrum DTJ Hradec Králové', 'Hradec Králové',   50.2100, 15.8500, 'teniscentrumhk.cz',  'www.teniscentrumhk.cz'),
  ('TK Dynamo Hradec Králové',        'Hradec Králové',   50.2100, 15.8100, 'dynamohradec.cz',    'www.dynamohradec.cz'),
  ('LTC Hradec Králové',              'Hradec Králové',   50.2000, 15.8300, 'tenis-klub.cz',      'www.tenis-klub.cz'),
  ('TK EDEN Hradec Králové',          'Hradec Králové',   50.2050, 15.8400, 'teniseden.cz',       'www.teniseden.cz'),
  -- Pardubice
  ('TK Pernštýn 1897 Pardubice',      'Pardubice',        50.0380, 15.7790, 'tkpernstyn.cz',      'www.tkpernstyn.cz'),
  -- České Budějovice
  ('LTC VITON České Budějovice',      'České Budějovice', 48.9750, 14.4800, 'teniscb.cz',         'www.teniscb.cz'),
  ('Tenis Talent Club České Budějovice','České Budějovice',48.9700,14.4900, 'tenistalent.cz',     'www.tenistalent.cz'),
  ('TJ Start České Budějovice – tenis','České Budějovice',48.9800, 14.4700, 'iscus.cz',           null),
  -- Prostějov
  ('TK AGROFERT Prostějov',           'Prostějov',        49.4720, 17.1110, 'tkagrofert.cz',      'www.tkagrofert.cz'),
  ('Tenisový klub Prostějov',         'Prostějov',        49.4700, 17.1100, 'tkprostejov.cz',     'www.tkprostejov.cz'),
  -- Zlín
  ('Tenisový klub Zlín',              'Zlín',             49.2240, 17.6670, 'tkzlin.cz',          'tkzlin.cz'),
  -- Ústí nad Labem
  ('Tenisový klub Ústí nad Labem',    'Ústí nad Labem',   50.6610, 14.0400, 'tenisusti.cz',       'www.tenisusti.cz'),
  -- Karlovy Vary
  ('Tenisový klub Karlovy Vary',      'Karlovy Vary',     50.2320, 12.8710, 'teniskv.cz',         'www.teniskv.cz'),
  -- Jihlava
  ('Teniscentrum Jihlava (Spartak)',  'Jihlava',          49.3970, 15.5910, 'teniscentrum-ji.cz', 'www.teniscentrum-ji.cz'),
  ('ČLTK Jihlava',                    'Jihlava',          49.4000, 15.5900, 'cltk-jihlava.cz',    'www.cltk-jihlava.cz'),
  -- Žďár nad Sázavou
  ('Tenisové kurty SPORTIS Žďár',     'Žďár nad Sázavou', 49.5630, 15.9390, 'sportispo.cz',       'www.sportispo.cz'),
  -- Frýdek-Místek
  ('TK Tennispoint Frýdek-Místek',    'Frýdek-Místek',    49.6830, 18.3500, 'tennispoint.cz',     'www.tennispoint.cz'),
  -- Karviná
  ('MTK Karviná',                     'Karviná',          49.8540, 18.5410, 'mtk-karvina.cz',     'www.mtk-karvina.cz'),
  ('Junior Tenis Karviná',            'Karviná',          49.8500, 18.5400, 'jteniskarvina.com',  'www.jteniskarvina.com'),
  -- Teplice
  ('TJ Slovan Teplice – tenis',       'Teplice',          50.6400, 13.8250, 'skvelecesko.cz',     null),
  ('LTC Panorama Teplice',            'Teplice',          50.6450, 13.8300, 'ltcpanoramateplice.cz','www.ltcpanoramateplice.cz'),
  -- Chomutov
  ('TK Chomutov',                     'Chomutov',         50.4600, 13.4180, 'tkchomutov.cz',      'www.tkchomutov.cz'),
  -- Mladá Boleslav
  ('LTC Mladá Boleslav',              'Mladá Boleslav',   50.4110, 14.9030, 'mbtenis.cz',         'www.mbtenis.cz'),
  ('TK Sportcentrum Mladá Boleslav',  'Mladá Boleslav',   50.4000, 14.9100, 'tenis-mb.cz',        'tenis-mb.cz'),
  -- Přerov
  ('Tenisový klub Přerov',            'Přerov',           49.4550, 17.4510, 'tenisprerov.cz',     'tenisprerov.cz'),
  -- Uherské Hradiště
  ('Tenisový klub Uherské Hradiště',  'Uherské Hradiště', 49.0700, 17.4600, 'tk-uh.cz',           'www.tk-uh.cz'),
  -- Břeclav
  ('Slovácký tenisový klub Břeclav',  'Břeclav',          48.7590, 16.8820, 'tenisklub-breclav.cz','tenisklub-breclav.cz'),
  -- Znojmo
  ('TK Znojmo',                       'Znojmo',           48.8560, 16.0490, 'tkznojmo.cz',        'www.tkznojmo.cz'),
  -- Kroměříž
  ('Tenisové kurty Kroměříž (SZMK)',  'Kroměříž',         49.2980, 17.3930, 'szmk.cz',            'www.szmk.cz')
) as v(name, city, lat, lng, source, website)
where not exists (select 1 from public.venues vv where vv.name = v.name);

-- ============================================================
-- 9) DALŠÍ REÁLNÉ KLUBY — menší a okresní města (web kde známý, jinak null)
-- ============================================================
insert into public.venues (name, city, lat, lng, status, source, website, verified, rating, reviews_count)
select v.name, v.city, v.lat, v.lng, 'unclaimed', v.source, v.website, false, 0, 0
from (values
  ('TK Sokolov',                      'Sokolov',          50.1810, 12.6400, 'tksokolov.cz',       'tksokolov.cz'),
  ('Tenisklub Cheb',                  'Cheb',             50.0790, 12.3700, 'tenisklubcheb.cz',   'www.tenisklubcheb.cz'),
  ('Tenisové kurty Domažlice',        'Domažlice',        49.4400, 12.9290, 'sportoviste-domazlice.cz','www.sportoviste-domazlice.cz'),
  ('Tenisový klub PTA Kolín',         'Kolín',            50.0280, 15.2000, 'firmy.cz',           null),
  ('Tenisové kurty Kutná Hora',       'Kutná Hora',       49.9480, 15.2680, 'kutnahora.cz',       'sportovnihala.kutnahora.cz'),
  ('Sport EDEN Beroun',               'Beroun',           49.9640, 14.0720, 'firmy.cz',           null),
  ('Tenisový klub Ústí nad Orlicí',   'Ústí nad Orlicí',  49.9740, 16.3940, 'tkuo.cz',            'www.tkuo.cz'),
  ('Tenis Trutnov',                   'Trutnov',          50.5610, 15.9120, 'tenistrutnov.cz',    'www.tenistrutnov.cz'),
  ('TK DEZA Valašské Meziříčí',       'Valašské Meziříčí',49.4720, 17.9710, 'tenisdeza.cz',       'www.tenisdeza.cz'),
  ('Tenisové kurty Vsetín (Zbrojovka)','Vsetín',          49.3390, 17.9960, 'mestovsetin.cz',     'mezvsetin-tenis.webnode.cz'),
  ('Tenisové centrum Vyškov',         'Vyškov',           49.2770, 16.9990, 'tenisvyskov.cz',     'www.tenisvyskov.cz'),
  ('LTC Hodonín',                     'Hodonín',          48.8550, 17.1320, 'ltchodonin.cz',      'ltchodonin.webnode.cz'),
  ('Slavoj Český Brod – tenis',       'Český Brod',       50.0740, 14.8600, 'cztenis.cz',         null),
  ('TO SK Mělník',                    'Mělník',           50.3500, 14.4740, 'cztenis.cz',         null),
  ('LTC Slovan Kladno',               'Kladno',           50.3470, 14.1030, 'cztenis.cz',         null),
  ('TK Písek',                        'Písek',            49.3090, 14.1470, 'cztenis.cz',         null),
  ('TK Strakonice',                   'Strakonice',       49.2620, 13.9020, 'cztenis.cz',         null),
  ('LTC Velešín',                     'Velešín',          48.8290, 14.4640, 'cztenis.cz',         null),
  ('LTC Sušice',                      'Sušice',           49.2310, 13.5200, 'cztenis.cz',         null),
  ('TK Žatec',                        'Žatec',            50.3270, 13.5460, 'cztenis.cz',         null),
  ('TK Spartak Děčín',                'Děčín',            50.7730, 14.1940, 'cztenis.cz',         null),
  ('TK Benešov',                      'Benešov',          49.7810, 14.6870, 'cztenis.cz',         null)
) as v(name, city, lat, lng, source, website)
where not exists (select 1 from public.venues vv where vv.name = v.name);


-- ##### 3/4 trainers.sql #####
-- ============================================================
-- TenisHub — TRENÉŘI navázaní na AREÁL (bez bordelu na mapě).
-- Spustit v Supabase SQL Editoru PO unclaimed-providers.sql. Bezpečné opakovaně.
--
-- Model: specialists.venue_id = "působí v tomto areálu".
--   - Trenér s venue_id NEMÁ vlastní pin na mapě (je vidět v profilu areálu).
--   - Trenér bez venue_id (nezávislý/mobilní) vlastní pin má.
--   - V katalogu/seznamu jsou vidět všichni trenéři bez ohledu na piny.
-- Zdroj trenérů = veřejné stránky "trenéři" jednotlivých klubů → rovnou známe areál.
-- ============================================================

alter table public.specialists add column if not exists venue_id uuid references public.venues(id) on delete set null;
create index if not exists specialists_venue_idx on public.specialists(venue_id);

-- Nové areály objevené přes coach-stránky (aby bylo kam trenéry navázat).
insert into public.venues (name, city, lat, lng, status, source, website, verified, rating, reviews_count)
select v.name, v.city, v.lat, v.lng, 'unclaimed', v.source, v.website, false, 0, 0
from (values
  ('TJ Start Ostrava – Poruba', 'Ostrava',         49.8320, 18.1660, 'start-ostrava.cz', 'www.start-ostrava.cz'),
  ('LTC Houštka Stará Boleslav', 'Stará Boleslav', 50.1930, 14.6820, 'tenishoustka.cz',  'www.tenishoustka.cz'),
  ('TK Precheza Přerov',        'Přerov',          49.4580, 17.4480, 'tkprerov.cz',      'tkprerov.cz')
) as v(name, city, lat, lng, source, website)
where not exists (select 1 from public.venues vv where vv.name = v.name);

-- Trenéři navázaní na areál (dědí město/souřadnice areálu; status 'unclaimed').
insert into public.specialists (kind, name, city, lat, lng, status, source, venue_id, verified, rating, reviews_count)
select v.kind::service_kind, v.name, ven.city, ven.lat, ven.lng, 'unclaimed', v.source, ven.id, false, 0, 0
from (values
  -- I. ČLTK Praha (zdroj: cltk.cz/cs/zavodni-tenis/treneri)
  ('coach',   'Petr Vaníček',          'I. ČLTK Praha', 'cltk.cz'),
  ('coach',   'Jiří Hřebec',           'I. ČLTK Praha', 'cltk.cz'),
  ('coach',   'Ivo Minář',             'I. ČLTK Praha', 'cltk.cz'),
  ('coach',   'Milan Trněný',          'I. ČLTK Praha', 'cltk.cz'),
  ('coach',   'Ing. Jan Vacek',        'I. ČLTK Praha', 'cltk.cz'),
  ('coach',   'Daniel Vaněk',          'I. ČLTK Praha', 'cltk.cz'),
  ('coach',   'Ing. Jaroslav Jandus',  'I. ČLTK Praha', 'cltk.cz'),
  ('coach',   'Bc. Antonín Štěpánek',  'I. ČLTK Praha', 'cltk.cz'),
  ('coach',   'Ing. Lubomír Štych',    'I. ČLTK Praha', 'cltk.cz'),
  ('coach',   'Magdaléna Zemanová',    'I. ČLTK Praha', 'cltk.cz'),
  ('fitness', 'Mgr. Pavel Janda',      'I. ČLTK Praha', 'cltk.cz'),
  ('fitness', 'Mgr. Richard Pavluv',   'I. ČLTK Praha', 'cltk.cz'),
  -- TK Konstruktiva Praha (zdroj: tkk.cz/tenisova-skola)
  ('coach',   'Petr Bičík',            'TK Konstruktiva Praha', 'tkk.cz'),
  -- Tenisový klub Zlín (zdroj: tkzlin.cz/zavodni-tenis/treneri)
  ('coach',   'Tomáš Macharáček',      'Tenisový klub Zlín', 'tkzlin.cz'),
  ('coach',   'Jiří Svoboda',          'Tenisový klub Zlín', 'tkzlin.cz'),
  ('coach',   'Petr Cimra',            'Tenisový klub Zlín', 'tkzlin.cz'),
  ('coach',   'Karolína Vlachová',     'Tenisový klub Zlín', 'tkzlin.cz'),
  ('coach',   'Filip Svozílek',        'Tenisový klub Zlín', 'tkzlin.cz'),
  -- TK AGROFERT Prostějov (zdroj: tkagrofert.cz)
  ('coach',   'Jaroslav Navrátil',     'TK AGROFERT Prostějov', 'tkagrofert.cz'),
  ('coach',   'Ivo Šilhánek',          'TK AGROFERT Prostějov', 'tkagrofert.cz'),
  ('coach',   'Jiří Novák',            'TK AGROFERT Prostějov', 'tkagrofert.cz'),
  ('coach',   'Antonín Pánek',         'TK AGROFERT Prostějov', 'tkagrofert.cz'),
  ('coach',   'Michal Navrátil',       'TK AGROFERT Prostějov', 'tkagrofert.cz'),
  ('coach',   'Tomáš Josefus',         'TK AGROFERT Prostějov', 'tkagrofert.cz'),
  ('coach',   'Tomáš Kajlík',          'TK AGROFERT Prostějov', 'tkagrofert.cz'),
  ('coach',   'Pavel Krček',           'TK AGROFERT Prostějov', 'tkagrofert.cz'),
  ('coach',   'Ondřej Soukup',         'TK AGROFERT Prostějov', 'tkagrofert.cz'),
  ('coach',   'Jan Perůtka',           'TK AGROFERT Prostějov', 'tkagrofert.cz'),
  ('fitness', 'Radek Štěpánek',        'TK AGROFERT Prostějov', 'tkagrofert.cz'),
  -- ŽLTC Brno (zdroj: zltc.cz/coaches-and-realization-team)
  ('coach',   'Roman Božek',           'ŽLTC Brno', 'zltc.cz'),
  ('coach',   'Eva Komárková',         'ŽLTC Brno', 'zltc.cz'),
  -- TJ Lokomotiva Plzeň (zdroj: tenis.tjloko-plzen.cz)
  ('coach',   'Jan Vladyka',           'TJ Lokomotiva Plzeň – tenis', 'tjloko-plzen.cz'),
  ('coach',   'Vlasta Knapp',          'TJ Lokomotiva Plzeň – tenis', 'tjloko-plzen.cz'),
  -- Teniscentrum DTJ Hradec Králové (zdroj: teniscentrumhk.cz)
  ('coach',   'Petr Šanovec',          'Teniscentrum DTJ Hradec Králové', 'teniscentrumhk.cz'),
  ('coach',   'Mgr. Radko Hrma',       'Teniscentrum DTJ Hradec Králové', 'teniscentrumhk.cz'),
  ('coach',   'Mgr. Vladimír Volejník','Teniscentrum DTJ Hradec Králové', 'teniscentrumhk.cz'),
  ('coach',   'Robin Vik',             'Teniscentrum DTJ Hradec Králové', 'teniscentrumhk.cz'),
  ('fitness', 'Martin Szakoš',         'Teniscentrum DTJ Hradec Králové', 'teniscentrumhk.cz'),
  -- TC Brno (zdroj: tc-brno.cz/treneri)
  ('coach',   'Ing. Petr Šafránek',    'TC Brno', 'tc-brno.cz'),
  ('coach',   'René Rotal',            'TC Brno', 'tc-brno.cz'),
  ('coach',   'Ing. Štěpán Šafránek',  'TC Brno', 'tc-brno.cz'),
  ('coach',   'Mgr. Jolana Jarůšková', 'TC Brno', 'tc-brno.cz'),
  ('coach',   'Mgr. Martina Šafránková','TC Brno', 'tc-brno.cz'),
  ('coach',   'Jakub Tyllich',         'TC Brno', 'tc-brno.cz'),
  ('coach',   'Ing. Hana Straková',    'TC Brno', 'tc-brno.cz'),
  ('coach',   'MUDr. Marek Majda',     'TC Brno', 'tc-brno.cz'),
  ('coach',   'Ondřej Komrska',        'TC Brno', 'tc-brno.cz'),
  ('coach',   'Bc. Přemysl Dokoupil',  'TC Brno', 'tc-brno.cz'),
  ('coach',   'Vojtěch Kořalka',       'TC Brno', 'tc-brno.cz'),
  ('coach',   'Bc. Matěj Kubín',       'TC Brno', 'tc-brno.cz'),
  ('coach',   'Michaela Nesvadbová',   'TC Brno', 'tc-brno.cz'),
  ('coach',   'Monika Viktorie Ferdusová','TC Brno', 'tc-brno.cz'),
  ('coach',   'Vendula Vurmová',       'TC Brno', 'tc-brno.cz'),
  ('coach',   'Jan Drábek',            'TC Brno', 'tc-brno.cz'),
  ('coach',   'David Klim',            'TC Brno', 'tc-brno.cz'),
  ('coach',   'Michal Olša',           'TC Brno', 'tc-brno.cz'),
  ('coach',   'Jan Komrska',           'TC Brno', 'tc-brno.cz'),
  ('coach',   'Jakub Vrtěna',          'TC Brno', 'tc-brno.cz'),
  -- TK MILO Olomouc (zdroj: tkmilo.cz/zavodni-tenis/treneri-klubu)
  ('coach',   'Simona Rýdel',          'TK MILO Olomouc', 'tkmilo.cz'),
  ('coach',   'Filip Nerušil',         'TK MILO Olomouc', 'tkmilo.cz'),
  ('coach',   'Mgr. Dominika Hejčová', 'TK MILO Olomouc', 'tkmilo.cz'),
  ('coach',   'Mgr. Dominik Szturc',   'TK MILO Olomouc', 'tkmilo.cz'),
  ('coach',   'Ondřej Janák',          'TK MILO Olomouc', 'tkmilo.cz'),
  ('coach',   'Mgr. Eva Tomajková',    'TK MILO Olomouc', 'tkmilo.cz'),
  ('coach',   'Karel Fuglík',          'TK MILO Olomouc', 'tkmilo.cz'),
  ('coach',   'Bc. Sylva Štefková',    'TK MILO Olomouc', 'tkmilo.cz'),
  -- TJ Start Ostrava – Poruba (zdroj: start-ostrava.cz/treneri)
  ('coach',   'Mgr. Martin Hollý',     'TJ Start Ostrava – Poruba', 'start-ostrava.cz'),
  ('coach',   'Petr Svoboda',          'TJ Start Ostrava – Poruba', 'start-ostrava.cz'),
  ('coach',   'Mgr. Kateřina Hollá-Lindnerová','TJ Start Ostrava – Poruba', 'start-ostrava.cz'),
  ('coach',   'David Telnar',          'TJ Start Ostrava – Poruba', 'start-ostrava.cz'),
  ('coach',   'Jiří Pelikán',          'TJ Start Ostrava – Poruba', 'start-ostrava.cz'),
  ('coach',   'Mgr. Zuzana Kožušníková','TJ Start Ostrava – Poruba', 'start-ostrava.cz'),
  ('coach',   'Lukáš Pivoda',          'TJ Start Ostrava – Poruba', 'start-ostrava.cz'),
  ('coach',   'Kateřina Florková',     'TJ Start Ostrava – Poruba', 'start-ostrava.cz'),
  ('coach',   'Kristýna Damašková',    'TJ Start Ostrava – Poruba', 'start-ostrava.cz'),
  ('coach',   'Jaroslav Golomb',       'TJ Start Ostrava – Poruba', 'start-ostrava.cz'),
  -- LTC Houštka Stará Boleslav (zdroj: tenishoustka.cz/trenersky-tym)
  ('coach',   'Jan Müller',            'LTC Houštka Stará Boleslav', 'tenishoustka.cz'),
  ('coach',   'Roman Boška',           'LTC Houštka Stará Boleslav', 'tenishoustka.cz'),
  ('coach',   'Theodor Devoty',        'LTC Houštka Stará Boleslav', 'tenishoustka.cz'),
  ('coach',   'Denisa Hindová',        'LTC Houštka Stará Boleslav', 'tenishoustka.cz'),
  ('coach',   'Pavel Zádrapa',         'LTC Houštka Stará Boleslav', 'tenishoustka.cz'),
  ('coach',   'Lenka Janoušková',      'LTC Houštka Stará Boleslav', 'tenishoustka.cz'),
  ('coach',   'Matias Musil',          'LTC Houštka Stará Boleslav', 'tenishoustka.cz'),
  ('coach',   'Adam Januška',          'LTC Houštka Stará Boleslav', 'tenishoustka.cz'),
  ('coach',   'Juraj Macho',           'LTC Houštka Stará Boleslav', 'tenishoustka.cz'),
  ('coach',   'Martina Kočnarová',     'LTC Houštka Stará Boleslav', 'tenishoustka.cz'),
  ('coach',   'Roman Jetel',           'LTC Houštka Stará Boleslav', 'tenishoustka.cz'),
  ('coach',   'David Talpa',           'LTC Houštka Stará Boleslav', 'tenishoustka.cz'),
  ('coach',   'David Minx',            'LTC Houštka Stará Boleslav', 'tenishoustka.cz'),
  ('coach',   'Kristýna Jelínková',    'LTC Houštka Stará Boleslav', 'tenishoustka.cz'),
  ('coach',   'Vojtěch Krinwald',      'LTC Houštka Stará Boleslav', 'tenishoustka.cz'),
  ('coach',   'Adéla Petržílková',     'LTC Houštka Stará Boleslav', 'tenishoustka.cz'),
  ('coach',   'Michal Šimeček',        'LTC Houštka Stará Boleslav', 'tenishoustka.cz'),
  -- TK Precheza Přerov (zdroj: tkprerov.cz/treneri)
  ('coach',   'Tomáš Krupa',           'TK Precheza Přerov', 'tkprerov.cz'),
  ('coach',   'Petr Dezort',           'TK Precheza Přerov', 'tkprerov.cz'),
  ('coach',   'Pavel Huťka',           'TK Precheza Přerov', 'tkprerov.cz'),
  ('coach',   'Martin Kašpar',         'TK Precheza Přerov', 'tkprerov.cz'),
  ('coach',   'Patrik Navara',         'TK Precheza Přerov', 'tkprerov.cz'),
  ('coach',   'Karel Čechák',          'TK Precheza Přerov', 'tkprerov.cz'),
  ('coach',   'Ladislav Polívka',      'TK Precheza Přerov', 'tkprerov.cz'),
  ('coach',   'Tomáš Jelínek',         'TK Precheza Přerov', 'tkprerov.cz'),
  ('coach',   'Roman Jurda',           'TK Precheza Přerov', 'tkprerov.cz')
) as v(kind, name, club, source)
join public.venues ven on ven.name = v.club
where not exists (
  select 1 from public.specialists s where s.name = v.name and s.venue_id = ven.id
);

-- ============================================================
-- Trenéři Tenisové školy SPIN (víceměstská škola → samostatní, bez venue_id,
-- v jejich městě; zdroj tenisovaskolaspin.cz). Dostanou vlastní pin na mapě.
-- ============================================================
insert into public.specialists (kind, name, city, lat, lng, status, source, verified, rating, reviews_count)
select 'coach'::service_kind, v.name, v.city, v.lat, v.lng, 'unclaimed', 'tenisovaskolaspin.cz', false, 0, 0
from (values
  ('Veronika Matulová',  'Brno',    49.1980, 16.6020),
  ('Diana Smirnovová',   'Brno',    49.1920, 16.6110),
  ('Kateřina Gašicová',  'Brno',    49.2000, 16.5980),
  ('Martin Kožiak',      'Brno',    49.1880, 16.6150),
  ('Laura Kozmová',      'Brno',    49.2030, 16.6070),
  ('Matouš Myslivec',    'Ostrava', 49.8400, 18.2850),
  ('Kristýna Pokorná',   'Ostrava', 49.8310, 18.2960),
  ('Ondřej Mrvík',       'Ostrava', 49.8380, 18.3000),
  ('Marek Viterna',      'Praha',   50.0850, 14.4300),
  ('Michaela Mervartová','Praha',   50.0750, 14.4120),
  ('Kateřina Sirotková', 'Praha',   50.0900, 14.4250)
) as v(name, city, lat, lng)
where not exists (select 1 from public.specialists s where s.name = v.name);


-- ##### 4/4 cleanup-demo.sql #####
-- ============================================================
-- TenisHub — SMAZÁNÍ VYMYŠLENÉHO DEMO OBSAHU z mapy.
-- Spustit v Supabase SQL Editoru. Bezpečné spustit opakovaně.
--
-- Maže jen demo seed (vymyšlené specialisty/areály/sparring z seed-data.sql).
-- POZNÁVÁ je podle: source IS NULL (reálné importy mají source vyplněný)
--   A ZÁROVEŇ owner_id IS NULL (nikdo si je nepřevzal / nevytvořil přihlášený uživatel).
-- => Reálné neověřené profily (source='vaseliga.cz' apod.) i účty uživatelů zůstávají.
-- Mazání specialists/venues kaskádově smaže i jejich services/courts/reviews.
-- ============================================================

-- vymyšlené sparring nabídky (demo mělo profile_id = NULL)
delete from public.sparring_offers where profile_id is null;

-- vymyšlení specialisté (demo bez source a bez vlastníka)
delete from public.specialists where source is null and owner_id is null;

-- vymyšlené areály (demo bez source a bez vlastníka)
delete from public.venues where source is null and owner_id is null;


-- ████████████████████████████████████████████████████████████
-- ██ SEKCE 6/12:  RUN-FUNKCE.sql
-- ██ Samospráva karty, recenze v2, zprávy, sparring v2
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- TenisHub — FUNKČNÍ SLUŽBY (bod 1–4). Spustit PO RUN-ALL.sql, najednou.
-- Bezpečné opakovaně.
-- ============================================================

-- ##### samosprava.sql (fotky, úložiště, odkaz na rezervaci) #####
-- ============================================================
-- TenisHub — SAMOSPRÁVA PROFILŮ (trenér/areál si spravuje kartu).
-- Spustit v Supabase SQL Editoru, PO RUN-ALL.sql. Bezpečné opakovaně.
-- ============================================================

-- fotky + odkaz na (externí) rezervační systém areálu
alter table public.specialists add column if not exists photo_url text;
alter table public.venues      add column if not exists photo_url text;
alter table public.venues      add column if not exists reservation_url text;

-- ============================================================
-- ÚLOŽIŠTĚ FOTEK (Supabase Storage, veřejné čtení, zápis jen do své složky)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- veřejné čtení fotek
drop policy if exists photos_read on storage.objects;
create policy photos_read on storage.objects for select
  using (bucket_id = 'photos');

-- nahrát/změnit/smazat smí přihlášený jen ve SVÉ složce (cesta = "<uid>/...")
drop policy if exists photos_insert on storage.objects;
create policy photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists photos_update on storage.objects;
create policy photos_update on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists photos_delete on storage.objects;
create policy photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);


-- ##### recenze-v2.sql (kategorie + moderace) #####
-- ============================================================
-- TenisHub — RECENZE v2: víc kategorií + moderace adminem.
-- Spustit v Supabase SQL Editoru, PO recenze-sparring.sql. Bezpečné opakovaně.
-- ============================================================

-- kategorie hodnocení (1–5) + stav moderace
alter table public.reviews add column if not exists r_skill    smallint;  -- odbornost
alter table public.reviews add column if not exists r_kids     smallint;  -- přístup k dětem
alter table public.reviews add column if not exists r_comm     smallint;  -- komunikace/spolehlivost
alter table public.reviews add column if not exists r_progress smallint;  -- přínos/posun
alter table public.reviews add column if not exists r_value    smallint;  -- cena/hodnota
alter table public.reviews add column if not exists status     text not null default 'pending';

do $$ begin
  alter table public.reviews add constraint reviews_status_chk check (status in ('pending','approved','rejected'));
exception when duplicate_object then null; end $$;

-- stávající recenze rovnou schválit (ať nezmizí)
update public.reviews set status = 'approved' where status = 'pending';

-- ============================================================
-- RLS: veřejně jen schválené; autor vidí svoje; admin vše. Admin smí měnit (moderace).
-- ============================================================
drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews for select
  using (status = 'approved' or author_id = auth.uid() or public.is_admin());

drop policy if exists reviews_modify on public.reviews;
create policy reviews_modify on public.reviews for update
  using (author_id = auth.uid() or public.is_admin());

-- ============================================================
-- Přepočet ratingu specialisty POUZE ze schválených recenzí (+ na approve).
-- ============================================================
create or replace function public.recompute_specialist_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  sid := coalesce(new.specialist_id, old.specialist_id);
  if sid is not null then
    update public.specialists s set
      rating = coalesce((select round(avg(rating)::numeric, 1) from public.reviews where specialist_id = sid and status = 'approved'), 0),
      reviews_count = (select count(*) from public.reviews where specialist_id = sid and status = 'approved')
    where s.id = sid;
  end if;
  return coalesce(new, old);
end; $$;

drop trigger if exists trg_recompute_rating on public.reviews;
create trigger trg_recompute_rating
  after insert or update or delete on public.reviews
  for each row execute function public.recompute_specialist_rating();


-- ##### zpravy.sql (interní zprávy) #####
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


-- ##### sparring-v2.sql (kritéria) #####
-- ============================================================
-- TenisHub — SPARRING v2: bohatší kritéria. PO RUN-ALL.sql. Bezpečné opakovaně.
-- ============================================================
alter table public.sparring_offers add column if not exists age        smallint;
alter table public.sparring_offers add column if not exists play_type  text;  -- amateur | competitive
alter table public.sparring_offers add column if not exists gender     text;  -- m | f | any
alter table public.sparring_offers add column if not exists handedness text;  -- right | left
alter table public.sparring_offers add column if not exists surface    text;  -- antuka | hala | tvrdy | any


-- ████████████████████████████████████████████████████████████
-- ██ SEKCE 7/12:  moje-cesta.sql
-- ██ Moje cesta (hráči, události, cíle, sezóna)
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- TenisHub — MOJE CESTA (sezónní průvodce hráče). Fáze 1 (MVP).
-- Spustit v Supabase SQL Editoru PO clenstvi.sql + admini.sql. Bezpečné opakovaně.
--
-- Model: účet má 1+ HRÁČŮ (dítě spravované rodičem i dospělý sám). Každý hráč má
-- události (kalendář), cíle sezóny a fáze sezóny (osa). Globální nastavení (typy
-- událostí + šablona sezóny) ladí admin.
-- ============================================================

-- ---------- HRÁČI ----------
create table if not exists public.cesta_players (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null,
  level      text not null default 'hobby' check (level in ('hobby','competitive')),
  birth_year smallint,
  created_at timestamptz not null default now()
);
create index if not exists cesta_players_owner_idx on public.cesta_players(owner_id);
-- pojistka i pro již existující tabulku: owner_id se doplní z přihlášeného uživatele
alter table public.cesta_players alter column owner_id set default auth.uid();
-- závodní hráč: soutěž/třída (volný text, např. "4. třída D"), aktuální místo v žebříčku, reg. číslo ČTS
alter table public.cesta_players add column if not exists category text;
alter table public.cesta_players add column if not exists ranking  integer;
alter table public.cesta_players add column if not exists cts_id   text;

alter table public.cesta_players enable row level security;
drop policy if exists cesta_players_rw on public.cesta_players;
create policy cesta_players_rw on public.cesta_players for all
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

-- pomocná: hráči, na které mám právo (vlastník nebo admin)
create or replace function public.my_player_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select id from public.cesta_players
  where owner_id = auth.uid() or public.is_admin();
$$;

-- ---------- UDÁLOSTI (kalendář) ----------
create table if not exists public.cesta_events (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references public.cesta_players(id) on delete cascade,
  date       date not null,
  type       text not null default 'training',  -- klíč z cesta_settings.event_types
  title      text,
  location   text,
  link       text,
  notes      text,
  opponent   text,        -- turnaj: soupeř
  score      text,        -- turnaj: skóre (textově, odvozeno ze setů)
  win        boolean,     -- turnaj: výhra?
  sets       jsonb,       -- turnaj: pole setů [{"me":6,"opp":4},…] pro analýzu (dotažení, otočky…)
  surface    text,        -- povrch: antuka | hard | koberec | trava | hala
  games      jsonb,       -- volitelně: pořadí gemů [["m","o","m",…],[…]] (mentální statistika)
  aces       smallint,    -- esa
  dfaults    smallint,    -- dvojchyby
  created_at timestamptz not null default now()
);
alter table public.cesta_events add column if not exists sets jsonb;
alter table public.cesta_events add column if not exists surface text;
alter table public.cesta_events add column if not exists games jsonb;
alter table public.cesta_events add column if not exists aces smallint;
alter table public.cesta_events add column if not exists dfaults smallint;
alter table public.cesta_events add column if not exists ext_id text;  -- značka importu z cesky-tenis.cz (dedup)
create index if not exists cesta_events_player_idx on public.cesta_events(player_id, date);

alter table public.cesta_events enable row level security;
drop policy if exists cesta_events_rw on public.cesta_events;
create policy cesta_events_rw on public.cesta_events for all
  using (player_id in (select public.my_player_ids()))
  with check (player_id in (select public.my_player_ids()));

-- ---------- CÍLE SEZÓNY ----------
create table if not exists public.cesta_goals (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references public.cesta_players(id) on delete cascade,
  title      text not null,
  target     text,
  progress   smallint not null default 0 check (progress between 0 and 100),
  done       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists cesta_goals_player_idx on public.cesta_goals(player_id);
alter table public.cesta_goals add column if not exists locked boolean not null default false;

alter table public.cesta_goals enable row level security;
drop policy if exists cesta_goals_rw on public.cesta_goals;
create policy cesta_goals_rw on public.cesta_goals for all
  using (player_id in (select public.my_player_ids()))
  with check (player_id in (select public.my_player_ids()));

-- ---------- FÁZE SEZÓNY (osa, per hráč) ----------
create table if not exists public.cesta_phases (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references public.cesta_players(id) on delete cascade,
  kind       text,                 -- prep | main | off
  label      text not null,
  color      text not null default '#cdd3da',
  start_date date not null,
  end_date   date not null
);
create index if not exists cesta_phases_player_idx on public.cesta_phases(player_id);

alter table public.cesta_phases enable row level security;
drop policy if exists cesta_phases_rw on public.cesta_phases;
create policy cesta_phases_rw on public.cesta_phases for all
  using (player_id in (select public.my_player_ids()))
  with check (player_id in (select public.my_player_ids()));

-- ---------- VLASTNÍ KATEGORIE KALENDÁŘE (per účet) ----------
create table if not exists public.cesta_types (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label      text not null,
  color      text not null default '#7C4DD6',
  sort       smallint not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists cesta_types_owner_idx on public.cesta_types(owner_id);
alter table public.cesta_types enable row level security;
drop policy if exists cesta_types_rw on public.cesta_types;
create policy cesta_types_rw on public.cesta_types for all
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

-- ---------- NASTAVENÍ (1 řádek, ladí admin) ----------
create table if not exists public.cesta_settings (
  id              smallint primary key default 1 check (id = 1),
  event_types     jsonb not null default '[
    {"key":"training","label":"Trénink","color":"#7C4DD6"},
    {"key":"tournament","label":"Turnaj","color":"#bf9a47"},
    {"key":"conditioning","label":"Kondice","color":"#3b8a5a"},
    {"key":"recovery","label":"Regenerace","color":"#4a9bd6"},
    {"key":"rest","label":"Volno","color":"#cdd3da"}
  ]'::jsonb,
  season_template jsonb not null default '[
    {"kind":"prep","label":"Příprava","color":"#3b8a5a","start":"11-01","end":"03-31"},
    {"kind":"main","label":"Sezóna","color":"#bf9a47","start":"04-01","end":"09-30"},
    {"kind":"off","label":"Mezisezóna","color":"#cdd3da","start":"10-01","end":"10-31"}
  ]'::jsonb,
  updated_at      timestamptz not null default now()
);
insert into public.cesta_settings (id) values (1) on conflict (id) do nothing;

alter table public.cesta_settings enable row level security;
drop policy if exists cesta_settings_read  on public.cesta_settings;
drop policy if exists cesta_settings_write on public.cesta_settings;
create policy cesta_settings_read  on public.cesta_settings for select using (true);
create policy cesta_settings_write on public.cesta_settings for all
  using (public.is_admin()) with check (public.is_admin());


-- ████████████████████████████████████████████████████████████
-- ██ SEKCE 8/12:  rezervace.sql
-- ██ Dostupnost + obsazené sloty (rezervace)
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- TenisHub — REÁLNÁ REZERVACE: dostupnost trenéra + obsazené termíny.
-- Spustit v Supabase SQL Editoru PO RUN-ALL.sql. Bezpečné opakovaně.
-- ============================================================

-- Týdenní dostupnost specialisty (opakuje se každý týden).
-- weekday: 0=neděle … 6=sobota (JS getDay). Čas v minutách od půlnoci.
create table if not exists public.availability (
  id            uuid primary key default gen_random_uuid(),
  specialist_id uuid not null references public.specialists(id) on delete cascade,
  weekday       smallint not null check (weekday between 0 and 6),
  start_min     smallint not null,
  end_min       smallint not null,
  slot_min      smallint not null default 60,
  created_at    timestamptz not null default now()
);
create index if not exists availability_spec_idx on public.availability(specialist_id);

alter table public.availability enable row level security;
drop policy if exists availability_read  on public.availability;
drop policy if exists availability_write on public.availability;
create policy availability_read on public.availability for select using (true);
create policy availability_write on public.availability for all
  using (specialist_id in (select id from public.specialists where owner_id = auth.uid()))
  with check (specialist_id in (select id from public.specialists where owner_id = auth.uid()));

-- Obsazené termíny specialisty — vrací JEN časy (ne kdo), aby šly skrýt volné/obsazené
-- bez prozrazení soukromí zákazníků. SECURITY DEFINER obchází RLS bookings.
create or replace function public.taken_slots(p_specialist uuid)
returns setof timestamptz
language sql stable security definer set search_path = public as $$
  select starts_at from public.bookings
  where specialist_id = p_specialist and status <> 'cancelled' and starts_at > now();
$$;


-- ████████████████████████████████████████████████████████████
-- ██ SEKCE 9/12:  vypletac.sql
-- ██ Služba Vyplétač raket
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- TenisHub — nový typ specialisty: VYPLÉTAČ (stringer).
-- Spustit v Supabase SQL Editoru samostatně (ADD VALUE nesmí být v transakci).
-- Bezpečné opakovaně (IF NOT EXISTS, PG 12+).
-- ============================================================
alter type public.service_kind add value if not exists 'stringer';


-- ████████████████████████████████████████████████████████████
-- ██ SEKCE 10/12:  ms-gem.sql
-- ██ MS GEM – jediný ověřený profil
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- TenisHub — MS GEM jako jediný OVĚŘENÝ subjekt na mapě.
-- Rozhodnutí: na mapě jen prověření a recenzovaní (žádné smetiště).
-- Mapa filtruje verified=true → ukáže se jen tohle. Ostatní data zůstávají
-- v DB (status unclaimed) pro pozdější prověření, jen nejsou na mapě.
-- Spustit v Supabase SQL Editoru. Bezpečné opakovaně.
-- ============================================================

insert into public.specialists (kind, name, city, lat, lng, status, source, website, verified, rating, reviews_count)
select 'academy'::service_kind, 'Tenisová a fitness akademie MS GEM', 'Dobřichovice', 49.9270, 14.2790,
       'claimed', 'msgem.cz', 'msgem.cz', true, 0, 0
where not exists (
  select 1 from public.specialists s where s.name = 'Tenisová a fitness akademie MS GEM'
);

-- pojistka: kdyby už existovala (z dřívějška), nastav ji jako ověřenou
update public.specialists
  set verified = true, status = 'claimed'
  where name = 'Tenisová a fitness akademie MS GEM';


-- ████████████████████████████████████████████████████████████
-- ██ SEKCE 11/12:  admin-delete-user.sql
-- ██ RPC pro mazání účtů (jen admin)
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- TenisHub — ADMIN: mazání účtů (nevratné). Spustit v Supabase SQL Editoru,
-- PO clenstvi.sql + admini.sql. Bezpečné opakovaně.
--
-- Smaže uživatele z auth.users → kaskádou zmizí jeho profil, členství i sparring.
-- Vlastnictví subjektů (owner_id) a rezervace se jen ODPOJÍ (set null) — subjekt
-- se vrátí na „neověřený", historie rezervací zůstane bez jména zákazníka.
-- SECURITY DEFINER = běží s právy vlastníka funkce (postgres) → smí sáhnout na auth.users.
-- ============================================================
create or replace function public.admin_delete_user(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Jen administrátor může mazat účty.';
  end if;
  if p_uid = auth.uid() then
    raise exception 'Nemůžeš smazat vlastní účet.';
  end if;
  delete from auth.users where id = p_uid;
end;
$$;

revoke all     on function public.admin_delete_user(uuid) from public, anon;
grant  execute on function public.admin_delete_user(uuid) to authenticated;


-- ████████████████████████████████████████████████████████████
-- ██ SEKCE 12/12:  RUN-KOMUNITA.sql
-- ██ Fórum, články, poradna, turnaje, bazar, ověření, import turnajů, e-mail notifikace
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- TenisHub — RUN-KOMUNITA.sql = JEDEN soubor pro poslední vlnu funkcí.
-- Obsahuje: fórum, komunita (články/poradna/turnaje/bazar), ověření,
-- import turnajů, e-mail notifikace. Spustit v Supabase SQL Editoru NAJEDNOU.
-- Předpoklad: už běží schema/clenstvi/admini/RUN-ALL/RUN-FUNKCE/moje-cesta.
-- Bezpečné opakovaně (IF NOT EXISTS / create or replace / drop policy if exists).
-- ============================================================


-- >>>>>>>>>>>>>>>>>>>> forum.sql <<<<<<<<<<<<<<<<<<<<

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

-- >>>>>>>>>>>>>>>>>>>> komunita.sql <<<<<<<<<<<<<<<<<<<<

-- ============================================================
-- TenisHub — KOMUNITA & OBSAH PRO RODIČE: Knihovna článků, Poradna,
-- Kalendář turnajů, Bazar + spolujízda. Spustit PO clenstvi.sql + admini.sql.
-- Bezpečné opakovaně. Čtení veřejné (SEO/bootstrap), zápis dle pravidel níže.
-- ============================================================

-- ---------- KNIHOVNA ČLÁNKŮ (píše admin, čtou všichni) ----------
create table if not exists public.articles (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  perex       text,
  body        text not null,
  category    text not null default 'navody',
  author_name text,
  cover_url   text,
  published   boolean not null default true,
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists articles_idx on public.articles(published, created_at desc);
alter table public.articles enable row level security;
drop policy if exists articles_read on public.articles;
drop policy if exists articles_write on public.articles;
create policy articles_read on public.articles for select
  using ((published and not hidden) or public.is_admin());
create policy articles_write on public.articles for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- PORADNA (ptá se HUB+ člen, odpovídá admin/odborník) ----------
create table if not exists public.advice (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid references auth.users(id) on delete set null,
  author_name text,
  topic       text not null default 'ostatni',
  body        text not null,
  answer      text,
  answered_by text,
  answered_at timestamptz,
  is_public   boolean not null default true,
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists advice_idx on public.advice(created_at desc);
alter table public.advice enable row level security;
drop policy if exists advice_read   on public.advice;
drop policy if exists advice_insert on public.advice;
drop policy if exists advice_modify on public.advice;
create policy advice_read on public.advice for select
  using ((answer is not null and is_public and not hidden) or author_id = auth.uid() or public.is_admin());
create policy advice_insert on public.advice for insert to authenticated
  with check (author_id = auth.uid());
create policy advice_modify on public.advice for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- KALENDÁŘ TURNAJŮ (spravuje admin) ----------
create table if not exists public.tournaments (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  date       date not null,
  city       text,
  category   text,
  surface    text,
  signup_url text,
  note       text,
  hidden     boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists tournaments_idx on public.tournaments(date);
alter table public.tournaments enable row level security;
drop policy if exists tournaments_read  on public.tournaments;
drop policy if exists tournaments_write on public.tournaments;
create policy tournaments_read on public.tournaments for select
  using (not hidden or public.is_admin());
create policy tournaments_write on public.tournaments for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- BAZAR + SPOLUJÍZDA (přidává HUB+ člen, čtou všichni) ----------
create table if not exists public.bazar_listings (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null default 'bazar' check (kind in ('bazar','spolujizda')),
  author_id   uuid references auth.users(id) on delete set null,
  author_name text,
  title       text not null,
  category    text,          -- bazar: raketa/boty/oblečení/ostatní
  city        text,
  price       text,          -- bazar: cena; spolujízda: počet míst
  body        text,
  contact     text,
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists bazar_idx on public.bazar_listings(kind, created_at desc);
alter table public.bazar_listings enable row level security;
drop policy if exists bazar_read   on public.bazar_listings;
drop policy if exists bazar_insert on public.bazar_listings;
drop policy if exists bazar_modify on public.bazar_listings;
create policy bazar_read on public.bazar_listings for select
  using (not hidden or public.is_admin());
create policy bazar_insert on public.bazar_listings for insert to authenticated
  with check (author_id = auth.uid());
create policy bazar_modify on public.bazar_listings for all
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

-- >>>>>>>>>>>>>>>>>>>> overeni.sql <<<<<<<<<<<<<<<<<<<<

-- ============================================================
-- TenisHub — žádost o ověření (poskytovatelský model). Spustit PO schema/claimable.
-- Bezpečné opakovaně. Poskytovatel s HUB+ klikne „Chci ověření" → verify_requested=true;
-- admin ve frontě schválí (verified=true, verify_requested=false).
-- ============================================================
alter table public.specialists add column if not exists verify_requested boolean not null default false;
alter table public.venues      add column if not exists verify_requested boolean not null default false;

-- >>>>>>>>>>>>>>>>>>>> turnaje-import.sql <<<<<<<<<<<<<<<<<<<<

-- ============================================================
-- TenisHub — import turnajů jednotlivců ze cesky-tenis.cz (dedup).
-- Spustit PO komunita.sql. Bezpečné opakovaně.
-- ============================================================
alter table public.tournaments add column if not exists ext_id text;
create index if not exists tournaments_ext_idx on public.tournaments(ext_id);

-- >>>>>>>>>>>>>>>>>>>> notifikace.sql <<<<<<<<<<<<<<<<<<<<

-- ============================================================
-- TenisHub — e-mailové notifikace (značka, že už byl e-mail odeslán → bez duplicit).
-- Spustit PO forum.sql + komunita.sql + zpravy.sql. Bezpečné opakovaně.
-- ============================================================
alter table public.advice       add column if not exists notified_at timestamptz;
alter table public.forum_posts  add column if not exists notified_at timestamptz;
alter table public.messages     add column if not exists notified_at timestamptz;
