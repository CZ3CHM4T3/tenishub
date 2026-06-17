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
