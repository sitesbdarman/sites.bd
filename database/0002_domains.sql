-- =============================================================================
-- 0002_domains.sql
-- Adds the `domains` table so the authenticated user's registered domains
-- can be listed on the dashboard and the "My Domains" page.
-- Safe to run once against a project that already has 0001_foundation.sql
-- applied (idempotent guards included).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- domains
-- One row per domain owned by a user. Intentionally minimal for this stage —
-- DNS records, nameservers, registration/renewal workflows, and admin
-- management are future steps and are not modeled here.
-- -----------------------------------------------------------------------------
create table if not exists public.domains (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  domain_name text not null,
  status text not null default 'pending'
    check (status in ('active', 'pending', 'expired', 'suspended')),
  auto_renew boolean not null default false,
  registered_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (domain_name)
);

create index if not exists idx_domains_owner_id on public.domains (owner_id);
create index if not exists idx_domains_status on public.domains (status);
create index if not exists idx_domains_owner_created_at on public.domains (owner_id, created_at desc);

-- -----------------------------------------------------------------------------
-- updated_at maintenance (reuses the shared trigger function from 0001)
-- -----------------------------------------------------------------------------
drop trigger if exists trg_domains_updated_at on public.domains;
create trigger trg_domains_updated_at
  before update on public.domains
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.domains enable row level security;

-- A user may only select their own domains. No insert/update/delete policy
-- is defined yet — writes will be added when registration/renewal/admin
-- flows are implemented (service-role or admin-checked policy at that time).
drop policy if exists "domains_select_own" on public.domains;
create policy "domains_select_own"
  on public.domains
  for select
  using (auth.uid() = owner_id);
