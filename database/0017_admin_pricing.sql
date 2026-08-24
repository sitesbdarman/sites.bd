-- 0017_admin_pricing.sql
-- Admin-editable website pricing plans. Run once in Supabase.

create table if not exists public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(12,2) not null default 0,
  currency text not null default 'BDT',
  billing_period text not null default 'year',
  description text not null default '',
  features jsonb not null default '[]'::jsonb,
  badge text,
  cta_text text not null default 'Get Started',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pricing_plans enable row level security;

drop policy if exists "pricing_public_read" on public.pricing_plans;
create policy "pricing_public_read"
on public.pricing_plans
for select
using (is_active = true);

insert into public.pricing_plans
  (name, price, currency, billing_period, description, features, badge, cta_text, is_active, sort_order)
select
  'SITES.BD Free Subdomain',
  0,
  'BDT',
  'forever',
  'Free subdomain for your personal or starter website.',
  '["yourname.sites.bd","Instant activation","Automatic DNS setup","Blogger and custom hosting support","No monthly fee"]'::jsonb,
  'FREE',
  'Get Free Subdomain',
  true,
  0
where not exists (select 1 from public.pricing_plans);

-- Admin writes are performed by the protected server-side admin API using the
-- service role after requireAdmin() has verified profiles.role = 'admin'.
