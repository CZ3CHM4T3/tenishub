-- ============================================================
-- TenisHub — ADMIN: auto-admin podle e-mailu + ochrana admin účtů.
-- Spustit PO admini.sql a admin-delete-user.sql. Bezpečné opakovaně.
-- ============================================================

-- 1) Kdo je admin (podle e-mailu). handle_new_user (admini.sql) to řeší při registraci;
--    tohle nastaví adminy i zpětně u existujících účtů.
--    ⇩ Až Jan pošle Jirkův e-mail, přidej ho do seznamu a spusť znovu.
update public.profiles
   set is_admin = true
 where lower(email) in (
   'schroffelh@seznam.cz'
   -- , 'jirkuv-email@example.com'
 );

-- 2) Admin účet NELZE smazat (ani sám sebe, ani jiného admina).
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
  if exists (select 1 from public.profiles where id = p_uid and is_admin) then
    raise exception 'Administrátorský účet nelze smazat.';
  end if;
  delete from auth.users where id = p_uid;
end;
$$;
revoke all     on function public.admin_delete_user(uuid) from public, anon;
grant  execute on function public.admin_delete_user(uuid) to authenticated;
