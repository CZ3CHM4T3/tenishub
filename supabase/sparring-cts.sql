-- Hráč (sparring) ověřený přes ČTS: odkaz na profil cesky-tenis.cz + příznak ověření.
-- Ověření je poloautomatické — když se hráč na cesky-tenis.cz najde, je ověřený.
alter table public.sparring_offers add column if not exists cts_url text;
alter table public.sparring_offers add column if not exists cts_verified boolean not null default false;
