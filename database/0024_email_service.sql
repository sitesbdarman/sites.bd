-- Provider-ready email service schema.
-- This stores mailbox/forwarding intent; actual delivery must be supplied by
-- an external mail provider (SMTP/IMAP/webmail or API integration).
create table if not exists public.email_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  domain_id uuid references public.domains(id) on delete set null,
  address text not null,
  provider text,
  provider_account_id text,
  status text not null default 'pending' check (status in ('pending','active','suspended','disabled')),
  storage_limit_mb integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists email_accounts_owner_address_unique on public.email_accounts(owner_id, lower(address));
create table if not exists public.email_forwarders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  domain_id uuid references public.domains(id) on delete set null,
  source_address text not null,
  destination_address text not null,
  status text not null default 'active' check (status in ('active','disabled')),
  created_at timestamptz not null default now()
);
alter table public.email_accounts enable row level security;
alter table public.email_forwarders enable row level security;
drop policy if exists email_accounts_own on public.email_accounts;
create policy email_accounts_own on public.email_accounts for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists email_forwarders_own on public.email_forwarders;
create policy email_forwarders_own on public.email_forwarders for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
