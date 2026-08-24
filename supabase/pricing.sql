-- Optional production pricing table.
create table if not exists public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null default 0,
  currency text not null default 'BDT',
  description text,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pricing_plans enable row level security;

drop policy if exists "pricing_public_read" on public.pricing_plans;
create policy "pricing_public_read"
on public.pricing_plans for select
using (is_active = true);

-- Add your verified admin-role policy here after confirming your actual
-- profiles role schema. Do not guess role/customer_id column names.
