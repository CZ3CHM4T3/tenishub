-- Modulární trenérské rozhraní (/klub → Nastavení).
-- Trenér si zapíná/vypíná moduly; uloží se jako pole klíčů do specialists.modules.
-- NULL = výchozí (vše zapnuté). Zápis smí jen vlastník (stávající RLS na specialists).
alter table public.specialists add column if not exists modules jsonb;
