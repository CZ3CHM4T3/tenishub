-- ============================================================
-- TenisHub — ADMIN: mazání účtů (nevratné). Spustit v Supabase SQL Editoru,
-- PO clenstvi.sql + admini.sql. Bezpečné opakovaně.
--
-- Smaže uživatele z auth.users → kaskádou zmizí jeho profil, členství i sparring.
-- Vlastnictví subjektů (owner_id) a rezervace se jen ODPOJÍ (set null) — subjekt
-- se vrátí na „neověřený", historie rezervací zůstane bez jména zákazníka.
-- SECURITY DEFINER = běží s právy vlastníka funkce (postgres) → smí sáhnout na auth.users.
-- ============================================================
create or replace function public.admin_delete_user(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Jen administrátor může mazat účty.';
  end if;
  if p_uid = auth.uid() then
    raise exception 'Nemůžeš smazat vlastní účet.';
  end if;
  delete from auth.users where id = p_uid;
end;
$$;

revoke all     on function public.admin_delete_user(uuid) from public, anon;
grant  execute on function public.admin_delete_user(uuid) to authenticated;
