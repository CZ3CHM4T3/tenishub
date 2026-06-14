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
