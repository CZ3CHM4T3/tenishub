-- ─────────────────────────────────────────────────────────────
-- PLATBY (Barion) + FAKTURY pro TenisHub — oddělené od fitness (vlastní číselná řada).
-- Spustit v Supabase SQL editoru. Potřebuje is_admin() (z clenstvi.sql/admini.sql).
-- ─────────────────────────────────────────────────────────────

-- Evidence plateb (mapování Barion PaymentId → uživatel/plán). Zápis jen service-role (z callbacku).
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references auth.users(id) on delete set null,
  plan text not null,                       -- 'hub_plus' | 'trener_plus' | 'expert_plus'
  amount_czk integer not null,
  months int not null default 1,
  payment_request_id text unique not null,  -- náš id (posíláme Barionu)
  barion_payment_id text,                   -- id od Barionu
  status text not null default 'pending',   -- pending | paid | failed | cancelled
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists payments_barion_idx on public.payments (barion_payment_id);
alter table public.payments enable row level security;
drop policy if exists "pay own read" on public.payments;
create policy "pay own read" on public.payments for select using (auth.uid() = profile_id or is_admin());
-- insert/update jen přes service-role (callback) → žádná anon/user policy

-- Faktury s vlastní číselnou řadou.
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text unique not null,              -- např. TH-2026-0001
  profile_id uuid references auth.users(id) on delete set null,
  customer_name text,
  customer_email text,
  item text not null,                       -- popis (Členství HUB+ na měsíc)
  amount_czk integer not null,
  vat_rate integer not null default 0,      -- 0 = neplátce DPH
  payment_id uuid references public.payments(id) on delete set null,
  issued_at timestamptz not null default now(),
  status text not null default 'paid'
);
alter table public.invoices enable row level security;
drop policy if exists "inv own read" on public.invoices;
create policy "inv own read" on public.invoices for select using (auth.uid() = profile_id or is_admin());
-- zápis jen service-role (callback)

-- Atomická číselná řada faktur po letech.
create table if not exists public.invoice_counter ( year int primary key, last int not null default 0 );
alter table public.invoice_counter enable row level security; -- čte/píše jen service-role

create or replace function public.next_invoice_number(p_year int, p_prefix text)
returns text language plpgsql security definer as $$
declare n int;
begin
  insert into public.invoice_counter(year, last) values (p_year, 1)
    on conflict (year) do update set last = public.invoice_counter.last + 1
    returning last into n;
  return p_prefix || '-' || p_year || '-' || lpad(n::text, 4, '0');
end $$;
