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
