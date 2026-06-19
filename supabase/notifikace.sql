-- ============================================================
-- TenisHub — e-mailové notifikace (značka, že už byl e-mail odeslán → bez duplicit).
-- Spustit PO forum.sql + komunita.sql + zpravy.sql. Bezpečné opakovaně.
-- ============================================================
alter table public.advice       add column if not exists notified_at timestamptz;
alter table public.forum_posts  add column if not exists notified_at timestamptz;
alter table public.messages     add column if not exists notified_at timestamptz;
