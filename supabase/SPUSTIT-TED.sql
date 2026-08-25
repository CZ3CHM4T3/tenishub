-- ============================================================
-- TenisHub — SPUSTIT TEĎ (jeden balík). Vlož celé do Supabase → SQL Editor → Run.
-- Bezpečné i opakovaně. Obsahuje: moduly trenéra, auto-admin + ochrana účtů,
-- štítek ADMIN v diskusích, magic link pro člena + zavřená registrace.
-- ============================================================

-- 1) MODULY TRENÉRSKÉHO ROZHRANÍ ----------------------------------
alter table public.specialists add column if not exists modules jsonb;

-- 2) AUTO-ADMIN PODLE E-MAILU + OCHRANA ÚČTŮ ----------------------
-- ⇩ Až pošleš Jirkův e-mail, odkomentuj řádek a spusť znovu.
update public.profiles
   set is_admin = true
 where lower(email) in (
   'schroffelh@seznam.cz'
   -- , 'jirkuv-email@example.com'
 );

create or replace function public.admin_delete_user(p_uid uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'Jen administrátor může mazat účty.'; end if;
  if p_uid = auth.uid() then raise exception 'Nemůžeš smazat vlastní účet.'; end if;
  if exists (select 1 from public.profiles where id = p_uid and is_admin) then
    raise exception 'Administrátorský účet nelze smazat.';
  end if;
  delete from auth.users where id = p_uid;
end; $$;
revoke all     on function public.admin_delete_user(uuid) from public, anon;
grant  execute on function public.admin_delete_user(uuid) to authenticated;

-- 3) ŠTÍTEK ADMIN V DISKUSÍCH ------------------------------------
alter table public.forum_threads add column if not exists author_is_admin boolean not null default false;
alter table public.forum_posts   add column if not exists author_is_admin boolean not null default false;
alter table public.advice        add column if not exists author_is_admin boolean not null default false;

create or replace function public.set_author_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.author_is_admin := coalesce((select is_admin from public.profiles where id = new.author_id), false);
  return new;
end $$;

drop trigger if exists trg_ft_admin on public.forum_threads;
create trigger trg_ft_admin before insert on public.forum_threads for each row execute function public.set_author_admin();
drop trigger if exists trg_fp_admin on public.forum_posts;
create trigger trg_fp_admin before insert on public.forum_posts   for each row execute function public.set_author_admin();
drop trigger if exists trg_ad_admin on public.advice;
create trigger trg_ad_admin before insert on public.advice        for each row execute function public.set_author_admin();

update public.forum_threads t set author_is_admin = true from public.profiles p where p.id = t.author_id and p.is_admin;
update public.forum_posts   t set author_is_admin = true from public.profiles p where p.id = t.author_id and p.is_admin;
update public.advice        t set author_is_admin = true from public.profiles p where p.id = t.author_id and p.is_admin;

-- 4) MAGIC LINK PRO ČLENA + ZAVŘENÁ REGISTRACE -------------------
create or replace function public.gen_member_invite(p_note text default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if not public.is_admin() then raise exception 'Jen admin může zvát členy.'; end if;
  v_code := 'MEM-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
  insert into public.coach_invites(code, created_by, note) values (v_code, auth.uid(), p_note);
  return v_code;
end $$;
revoke all     on function public.gen_member_invite(text) from public, anon;
grant  execute on function public.gen_member_invite(text) to authenticated;

create or replace function public.apply_invite(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare v_inv public.coach_invites; v_coach public.profiles; v_name text;
begin
  if auth.uid() is null then raise exception 'Nejste přihlášen.'; end if;
  p_code := upper(trim(p_code));
  select * into v_inv from public.coach_invites where upper(code) = p_code and used_by is null;
  if found then
    update public.coach_invites set used_by = auth.uid(), used_at = now() where id = v_inv.id;
    if v_inv.code like 'TRN-%' then
      update public.profiles
        set is_coach = true,
            coach_code = coalesce(coach_code, 'C-' || upper(substr(md5(gen_random_uuid()::text), 1, 6)))
        where id = auth.uid();
      return 'coach';
    else
      insert into public.memberships(profile_id, plan, status, expires_at, auto_renew, price_czk)
        values (auth.uid(), 'hubplus', 'active', now() + interval '365 days', false, 0);
      return 'member';
    end if;
  end if;
  select * into v_coach from public.profiles where upper(coach_code) = p_code and is_coach = true;
  if found then
    if v_coach.id = auth.uid() then return 'self'; end if;
    select coalesce(full_name, email) into v_name from public.profiles where id = auth.uid();
    insert into public.coach_roster(coach_id, member_id, member_name)
      values (v_coach.id, auth.uid(), v_name)
      on conflict (coach_id, member_id) do nothing;
    return 'joined';
  end if;
  return 'invalid';
end $$;

-- HOTOVO. Po spuštění se odhlas a znovu přihlas, ať se načte admin stav.
