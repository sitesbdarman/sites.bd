-- =============================================================================
-- 0007_payments.sql
-- Payment transaction foundation. Phase 3 uses a safe simulation gateway until
-- a production provider (e.g. SSLCommerz/bKash/Nagad) is configured.
-- =============================================================================

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  gateway text not null default 'manual',
  transaction_id text not null unique,
  sender_number text,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'BDT',
  status text not null default 'pending_review' check (status in ('pending_review','initiated','paid','failed','refunded')),
  paid_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_payments_customer_id on public.payments(customer_id);
create index if not exists idx_payments_order_id on public.payments(order_id);
create index if not exists idx_payments_invoice_id on public.payments(invoice_id);

alter table public.payments enable row level security;
drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments for select using (auth.uid() = customer_id);
drop policy if exists "payments_insert_own" on public.payments;
create policy "payments_insert_own" on public.payments for insert with check (auth.uid() = customer_id);

create or replace function public.generate_transaction_id()
returns text
language plpgsql
as $$
declare candidate text;
begin
  loop
    candidate := 'TXN-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 12));
    exit when not exists (select 1 from public.payments where transaction_id = candidate);
  end loop;
  return candidate;
end;
$$;
