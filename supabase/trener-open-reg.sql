-- ============================================================
-- TenisHub — otevřená registrace trenéra + Jirka jako admin.
-- Spustit v Supabase → SQL Editor. Bezpečné opakovaně.
-- ============================================================

-- 1) Trenér se zaregistruje volně (/pro-trenery → /prihlaseni?role=trener);
--    po registraci si sám aktivuje trenérský profil (is_coach + osobní kód).
create or replace function public.become_coach()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Nejste přihlášen.'; end if;
  update public.profiles
    set is_coach = true,
        coach_code = coalesce(coach_code, 'C-' || upper(substr(md5(gen_random_uuid()::text), 1, 6)))
    where id = auth.uid();
end $$;
revoke all     on function public.become_coach() from public, anon;
grant  execute on function public.become_coach() to authenticated;

-- 2) Jirka = admin
update public.profiles set is_admin = true where lower(email) = 'machekjirka@gmail.com';
