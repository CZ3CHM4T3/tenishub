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

