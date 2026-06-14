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
