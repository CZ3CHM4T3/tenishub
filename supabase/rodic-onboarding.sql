-- Rodičovský onboarding: rodič si vybere trenéra a POŽÁDÁ o vstup do komunity;
-- trenér žádost schválí (nebo ne). coach_roster.status: pending | active | removed.
-- Spustit v Supabase SQL Editoru (po trener-system.sql).

create or replace function public.request_join_coach(p_coach uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_name text; v_ok boolean;
begin
  if auth.uid() is null then raise exception 'Nejste přihlášen.'; end if;
  if p_coach = auth.uid() then raise exception 'Nelze se připojit sám k sobě.'; end if;
  select is_coach into v_ok from public.profiles where id = p_coach;
  if not coalesce(v_ok, false) then raise exception 'Tento trenér zatím nemá na TenisHubu klub.'; end if;
  select coalesce(full_name, email) into v_name from public.profiles where id = auth.uid();
  insert into public.coach_roster(coach_id, member_id, member_name, kind, status)
    values (p_coach, auth.uid(), v_name, 'parent', 'pending')
    on conflict (coach_id, member_id) do nothing;
  return 'pending';
end $$;

-- rodič smí zrušit svou žádost (smazat vlastní řádek)
drop policy if exists coach_roster_member_del on public.coach_roster;
create policy coach_roster_member_del on public.coach_roster for delete
  using (member_id = auth.uid() or coach_id = auth.uid() or public.is_admin());
