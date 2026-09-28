-- ============================================================
-- TenisHub — SCHVALOVACÍ TOK: nový poskytovatel = 'pending' (čeká na schválení
-- adminem), pak 'claimed' (šedý neověřený pin na mapě), pak verified=true (barevný).
-- Spustit v Supabase SQL Editoru PO claimable.sql. Bezpečné opakovaně.
-- ============================================================

-- 1) Rozšíření stavu o 'pending'.
alter table public.specialists drop constraint if exists specialists_status_chk;
alter table public.specialists add constraint specialists_status_chk
  check (status in ('pending','unclaimed','claimed','hidden'));
alter table public.venues drop constraint if exists venues_status_chk;
alter table public.venues add constraint venues_status_chk
  check (status in ('pending','unclaimed','claimed','hidden'));

-- 2) Veřejnost NEvidí 'pending' (ani 'hidden'); majitel a admin vidí svoje.
drop policy if exists specialists_read on public.specialists;
create policy specialists_read on public.specialists for select
  using (status not in ('hidden','pending') or owner_id = auth.uid() or public.is_admin());
drop policy if exists venues_read on public.venues;
create policy venues_read on public.venues for select
  using (status not in ('hidden','pending') or owner_id = auth.uid() or public.is_admin());

-- Pozn.: existující profily zůstávají 'claimed' (už jsou „schválené"). Nové self-registrace
-- appka zakládá jako 'pending'. Admin je schválí ve fronte (status → 'claimed').
