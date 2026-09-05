-- 0025_admin_catalog.sql
-- Make commercial catalogs fully admin-managed while preserving safe public reads.

alter table public.hosting_plans add column if not exists description text not null default '';
alter table public.hosting_plans add column if not exists sort_order integer not null default 0;

create table if not exists public.domain_pricing (
  id uuid primary key default gen_random_uuid(),
  tld text not null unique,
  registration_price numeric(12,2) not null default 0,
  renewal_price numeric(12,2) not null default 0,
  currency text not null default 'BDT',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_domain_pricing_active on public.domain_pricing(is_active, sort_order);

alter table public.addons add column if not exists billing_cycle text not null default 'one_time';
alter table public.addons add column if not exists currency text not null default 'BDT';
alter table public.addons add column if not exists sort_order integer not null default 0;

alter table public.hosting_plans enable row level security;
alter table public.addons enable row level security;
alter table public.domain_pricing enable row level security;

drop policy if exists "hosting_plans_select_active" on public.hosting_plans;
create policy "hosting_plans_select_active" on public.hosting_plans for select using (is_active = true);
drop policy if exists "addons_select_active" on public.addons;
create policy "addons_select_active" on public.addons for select using (is_active = true);
drop policy if exists "domain_pricing_select_active" on public.domain_pricing;
create policy "domain_pricing_select_active" on public.domain_pricing for select using (is_active = true);

insert into public.hosting_plans(name,type,price,billing_cycle,description,sort_order)
select * from (values
 ('WordPress Hosting','premium',1000::numeric,'yearly','Optimized hosting for WordPress sites with 1-click install.',10),
 ('cPanel Hosting','premium',600::numeric,'yearly','Full cPanel control panel access for general-purpose hosting.',20),
 ('Business Hosting','premium',1500::numeric,'yearly','A higher-capacity package for business websites.',30),
 ('Vercel','free',0::numeric,'n_a','Deploy static and serverless projects on Vercel free tier.',40),
 ('GitHub Pages','free',0::numeric,'n_a','Host a static site directly from a GitHub repository.',50),
 ('Blogger','free',0::numeric,'n_a','Google''s free blogging platform.',60),
 ('Google Sites','free',0::numeric,'n_a','Simple drag-and-drop site builder from Google.',70),
 ('Custom Connection','custom',0::numeric,'n_a','Point the domain to your own server using a name server and IP address.',80)
) v(name,type,price,billing_cycle,description,sort_order)
where not exists (select 1 from public.hosting_plans);

insert into public.addons(name,description,price,billing_cycle,currency,sort_order)
select * from (values
 ('Ready-made Website','A pre-built website template, customized with your branding and content.',3000::numeric,'one_time','BDT',10),
 ('Web Designing Services','Custom website design and development tailored to your requirements.',8000::numeric,'one_time','BDT',20),
 ('Other Service','Any additional service not listed above — discussed with our team after checkout.',0::numeric,'one_time','BDT',30)
) v(name,description,price,billing_cycle,currency,sort_order)
where not exists (select 1 from public.addons);

insert into public.domain_pricing(tld,registration_price,renewal_price,currency,sort_order)
select * from (values
 ('com',1299,1499,'BDT',10),('net',1499,1699,'BDT',20),('org',1399,1599,'BDT',30),
 ('io',3999,4499,'BDT',40),('dev',1599,1799,'BDT',50),('co',2499,2999,'BDT',60),('app',1799,2099,'BDT',70)
) v(tld,registration_price,renewal_price,currency,sort_order)
where not exists (select 1 from public.domain_pricing);
