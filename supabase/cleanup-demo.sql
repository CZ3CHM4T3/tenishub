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
