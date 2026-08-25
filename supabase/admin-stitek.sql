-- ============================================================
-- TenisHub — štítek ADMIN u autora v diskusích (fórum + poradna).
-- Sloupec se plní TRIGGEREM z profiles.is_admin (klient ho nemůže podvrhnout).
-- Spustit po forum.sql / komunita.sql. Bezpečné opakovaně.
-- ============================================================
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

-- zpětné doplnění u existujících příspěvků
update public.forum_threads t set author_is_admin = true from public.profiles p where p.id = t.author_id and p.is_admin;
update public.forum_posts   t set author_is_admin = true from public.profiles p where p.id = t.author_id and p.is_admin;
update public.advice        t set author_is_admin = true from public.profiles p where p.id = t.author_id and p.is_admin;
