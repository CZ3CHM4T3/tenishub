-- ============================================================
-- TenisHub — multi-role (klobouky) + Jirka admin.
-- profiles.roles = pole klíčů rolí, které člen zastává (trener zdarma, ostatní HUB+).
-- Spustit v Supabase → SQL Editor. Bezpečné opakovaně.
-- ============================================================
alter table public.profiles add column if not exists roles jsonb;

-- become_coach (kdyby ještě nebyl spuštěn z trener-open-reg.sql)
create or replace function public.become_coach()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Nejste přihlášen.'; end if;
  update public.profiles set is_coach = true,
    coach_code = coalesce(coach_code, 'C-' || upper(substr(md5(gen_random_uuid()::text),1,6)))
    where id = auth.uid();
end $$;
revoke all     on function public.become_coach() from public, anon;
grant  execute on function public.become_coach() to authenticated;

-- Jirka = admin (správný e-mail)
update public.profiles set is_admin = true where lower(email) = 'machekjirka@icloud.com';
