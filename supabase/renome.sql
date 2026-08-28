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

-- Uložená úroveň renomé na profilu (aby ji veřejný profil jen ČETL a nešla podvrhnout).
alter table public.specialists add column if not exists renome_level int not null default 0;

-- Přepočet a uložení renomé z REÁLNÝCH metrik (nedá se injektovat falešná úroveň).
create or replace function public.refresh_renome(p_coach uuid)
returns int language plpgsql security definer as $$
declare v_members int; v_rating numeric; v_reviews int; v_verified bool; v_level int;
begin
  select coalesce(count(*),0) into v_members
  from public.coach_roster r
  join public.memberships m on m.profile_id = r.member_id
  where r.coach_id = p_coach and r.status='active' and r.kind='parent'
    and m.status='active' and m.expires_at > now();

  select coalesce(rating,0), coalesce(reviews_count,0), coalesce(verified,false)
    into v_rating, v_reviews, v_verified
  from public.specialists where owner_id = p_coach order by created_at limit 1;

  v_level := case
    when v_verified and v_members >= 40 and v_rating >= 4.8 and v_reviews >= 15 then 3
    when v_verified and v_members >= 25 and v_rating >= 4.5 and v_reviews >= 5 then 2
    when v_verified and v_members >= 10 and v_reviews >= 1 then 1
    else 0 end;

  update public.specialists set renome_level = v_level where owner_id = p_coach;
  return v_level;
end $$;

grant execute on function public.refresh_renome(uuid) to authenticated;
