-- ============================================================
-- TenisHub — ZAKLÁDAJÍCÍ PROFILY: Jan (fitness) + Jiří (tenis) v akademii MS GEM.
-- Oba OVĚŘENÍ, renomé 3 (maximum). Piny mírně odsazené od akademie (Dobřichovice),
-- aby byly při brouzdání mapou vidět oba a nepřekrývaly se.
-- Spustit v Supabase SQL Editoru. Bezpečné opakovaně (upsert dle owner_id+kind).
-- Předpoklad: účty už existují (oba se přihlásili). Adresu/web/foto si doplníte v /ucet.
-- ============================================================

-- Pojistky, ať skript běží i bez dřívějších migrací:
alter table public.specialists add column if not exists renome_level int not null default 0;
alter table public.specialists add column if not exists verified boolean not null default false;
alter table public.specialists add column if not exists reviews_count int not null default 0;

do $$
declare v_jan uuid; v_jirka uuid;
begin
  select id into v_jan   from auth.users where lower(email) = 'schroffelh@seznam.cz';
  select id into v_jirka from auth.users where lower(email) = 'machekjirka@gmail.com';

  -- JAN SCHRÖFFEL — fitness trenér
  if v_jan is not null then
    if exists (select 1 from public.specialists where owner_id = v_jan and kind = 'fitness') then
      update public.specialists set
        name = 'Jan Schröffel', city = 'Dobřichovice',
        lat = 49.92745, lng = 14.27960,
        verified = true, renome_level = 3, status = 'claimed'
      where owner_id = v_jan and kind = 'fitness';
    else
      insert into public.specialists (owner_id, kind, name, city, lat, lng, verified, renome_level, status, rating, reviews_count)
      values (v_jan, 'fitness', 'Jan Schröffel', 'Dobřichovice', 49.92745, 14.27960, true, 3, 'claimed', 0, 0);
    end if;
  end if;

  -- JIŘÍ MACHEK — tenisový trenér
  if v_jirka is not null then
    if exists (select 1 from public.specialists where owner_id = v_jirka and kind = 'coach') then
      update public.specialists set
        name = 'Jiří Machek', city = 'Dobřichovice',
        lat = 49.92655, lng = 14.27840,
        verified = true, renome_level = 3, status = 'claimed'
      where owner_id = v_jirka and kind = 'coach';
    else
      insert into public.specialists (owner_id, kind, name, city, lat, lng, verified, renome_level, status, rating, reviews_count)
      values (v_jirka, 'coach', 'Jiří Machek', 'Dobřichovice', 49.92655, 14.27840, true, 3, 'claimed', 0, 0);
    end if;
  end if;
end $$;

-- Kontrola: mělo by vypsat oba profily jako verified, renome_level 3.
select s.name, s.kind, s.city, s.lat, s.lng, s.verified, s.renome_level
from public.specialists s
join auth.users u on u.id = s.owner_id
where lower(u.email) in ('schroffelh@seznam.cz', 'machekjirka@gmail.com')
order by s.name;
