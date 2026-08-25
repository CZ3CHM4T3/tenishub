-- ============================================================
-- TenisHub — MAGIC LINK pro člena/rodiče (veřejná registrace zavřená).
-- Admin vygeneruje unikátní jednorázový kód MEM-…; registrace přes něj
-- založí účet a rovnou přidělí HUB+ (comp, 1 rok), ať má člen přístup.
-- Spustit PO trener-system.sql. Bezpečné opakovaně.
-- ============================================================

-- Generátor (jen admin) — vrátí kód MEM-XXXXXX
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

-- apply_invite rozšířené: TRN- = trenér, MEM- = člen (comp HUB+), C- = připojení pod trenéra
create or replace function public.apply_invite(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare v_inv public.coach_invites; v_coach public.profiles; v_name text;
begin
  if auth.uid() is null then raise exception 'Nejste přihlášen.'; end if;
  p_code := upper(trim(p_code));

  -- jednorázová pozvánka z coach_invites (TRN- trenér / MEM- člen)
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
      -- MEM- : comp členství na rok, ať má člen rovnou přístup
      insert into public.memberships(profile_id, plan, status, expires_at, auto_renew, price_czk)
        values (auth.uid(), 'hubplus', 'active', now() + interval '365 days', false, 0);
      return 'member';
    end if;
  end if;

  -- osobní kód trenéra (C-) — rodič/kolega se připojuje pod trenéra
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
