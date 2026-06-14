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
