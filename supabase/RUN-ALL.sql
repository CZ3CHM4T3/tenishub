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

