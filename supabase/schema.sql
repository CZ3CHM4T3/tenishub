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
