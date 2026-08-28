-- Renomé trenéra — počítání platících HUB+ svěřenců přes zvací odkaz (coach_roster).
-- Security definer kvůli RLS na memberships (trenér normálně cizí členství nevidí).
-- Spustit v Supabase SQL editoru.

create or replace function public.coach_paying_members(p_coach uuid)
returns int language sql security definer stable as $$
  select count(*)::int
  from public.coach_roster r
  join public.memberships m on m.profile_id = r.member_id
  where r.coach_id = p_coach
    and r.status = 'active'
    and r.kind = 'parent'
    and m.status = 'active'
    and m.expires_at > now();
$$;

grant execute on function public.coach_paying_members(uuid) to authenticated;
