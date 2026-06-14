-- ============================================================
-- TenisHub — RECENZE + SPARRING (doplnění). Spustit PO schema.sql.
-- Bezpečné spustit opakovaně.
-- ============================================================

-- Jméno autora denormalizovaně (profiles už nejsou veřejně čitelné kvůli e-mailům,
-- tak si jméno uložíme přímo k recenzi/inzerátu pro veřejné zobrazení).
alter table public.reviews          add column if not exists author_name text;
alter table public.sparring_offers  add column if not exists author_name text;

-- Recenze smí přidat každý přihlášený (na svoje jméno).
drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews for insert
  with check (author_id = auth.uid());

-- Po vložení/smazání recenze přepočítat hodnocení a počet u specialisty.
create or replace function public.recompute_specialist_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  sid := coalesce(new.specialist_id, old.specialist_id);
  if sid is not null then
    update public.specialists s set
      rating = coalesce((select round(avg(rating)::numeric, 1) from public.reviews where specialist_id = sid), 0),
      reviews_count = (select count(*) from public.reviews where specialist_id = sid)
    where s.id = sid;
  end if;
  return null;
end; $$;

drop trigger if exists reviews_recompute on public.reviews;
create trigger reviews_recompute
  after insert or delete on public.reviews
  for each row execute function public.recompute_specialist_rating();
