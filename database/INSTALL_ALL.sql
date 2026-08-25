-- SITES.BD complete database installer
-- Run this file once in Supabase SQL Editor, from top to bottom.
-- It includes every migration in this project.


-- ============================================================
-- 0001_foundation.sql
-- ============================================================
-- =============================================================================
-- 0001_foundation.sql
-- Step 2: Database foundation — profiles, hosting_plans, addons.
-- Safe to run once against a fresh Supabase project (idempotent guards included).
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- profiles
-- Extends auth.users 1:1. Row is created by the application immediately after
-- Supabase Auth sign-up (registration flow arrives in a later step).
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  customer_id text not null unique,
  full_name text,
  email text not null unique,
  mobile_number text unique,
  address jsonb,
  profile_status text not null default 'pending'
    check (profile_status in ('pending', 'complete')),
  role text not null default 'user'
    check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_customer_id on public.profiles (customer_id);
create index if not exists idx_profiles_role on public.profiles (role);

-- -----------------------------------------------------------------------------
-- hosting_plans
-- Admin-managed catalog of hosting packages (premium / free / custom).
-- -----------------------------------------------------------------------------
create table if not exists public.hosting_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('premium', 'free', 'custom')),
  price numeric(10, 2) not null default 0,
  billing_cycle text not null default 'yearly'
    check (billing_cycle in ('monthly', 'yearly', 'one_time', 'n_a')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hosting_plans_active on public.hosting_plans (is_active);

-- -----------------------------------------------------------------------------
-- addons
-- Admin-managed catalog of checkout add-ons.
-- -----------------------------------------------------------------------------
create table if not exists public.addons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_addons_active on public.addons (is_active);

-- =============================================================================
-- updated_at maintenance
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_hosting_plans_updated_at on public.hosting_plans;
create trigger trg_hosting_plans_updated_at
  before update on public.hosting_plans
  for each row execute function public.set_updated_at();

drop trigger if exists trg_addons_updated_at on public.addons;
create trigger trg_addons_updated_at
  before update on public.addons
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Customer ID generation
-- Unique, non-sequential, customer-safe identifier (distinct from auth.users.id).
-- Format: "CUS-" + 10 random uppercase base32-ish characters, collision-checked.
-- =============================================================================
create or replace function public.generate_customer_id()
returns text
language plpgsql
as $$
declare
  candidate text;
  exists_already boolean;
begin
  loop
    candidate := 'CUS-' || upper(
      substr(
        replace(encode(gen_random_bytes(8), 'base64'), '/', ''),
        1, 10
      )
    );
    candidate := regexp_replace(candidate, '[^A-Z0-9\-]', '', 'g');

    select exists (
      select 1 from public.profiles where customer_id = candidate
    ) into exists_already;

    exit when not exists_already;
  end loop;

  return candidate;
end;
$$;

-- Auto-assign customer_id on insert if the caller didn't supply one.
create or replace function public.assign_customer_id()
returns trigger
language plpgsql
as $$
begin
  if new.customer_id is null or length(trim(new.customer_id)) = 0 then
    new.customer_id := public.generate_customer_id();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_assign_customer_id on public.profiles;
create trigger trg_profiles_assign_customer_id
  before insert on public.profiles
  for each row execute function public.assign_customer_id();

-- =============================================================================
-- Immutability guard
-- Prevent a normal user from changing role, customer_id, email, or an
-- already-set mobile_number via a direct table update (defense in depth —
-- RLS below already restricts which rows/columns a user can touch, but this
-- trigger protects against any future overly-broad policy too).
-- =============================================================================
create or replace function public.enforce_profile_immutable_fields()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and coalesce(current_setting('app.allow_profile_role_change', true), 'off') <> 'on' then
    raise exception 'role cannot be changed directly';
  end if;

  if new.customer_id is distinct from old.customer_id then
    raise exception 'customer_id cannot be changed';
  end if;

  if new.email is distinct from old.email then
    raise exception 'email cannot be changed';
  end if;

  if old.mobile_number is not null
     and new.mobile_number is distinct from old.mobile_number then
    raise exception 'mobile_number cannot be changed once set';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_immutable_fields on public.profiles;
create trigger trg_profiles_immutable_fields
  before update on public.profiles
  for each row execute function public.enforce_profile_immutable_fields();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.hosting_plans enable row level security;
alter table public.addons enable row level security;

-- profiles: a user may read and update only their own row.
-- Combined with the trigger above, this does NOT allow changing role,
-- customer_id, email, or an already-set mobile_number.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Row creation happens via a trusted server-side flow (service-role client)
-- immediately after Supabase Auth sign-up, so no public INSERT policy is
-- defined here yet. This will be revisited when registration is implemented.

-- hosting_plans / addons: public read of active items only.
-- No write policies yet — management is admin-only and will be added when
-- the Admin Panel is implemented (service-role or admin-checked policy).
drop policy if exists "hosting_plans_select_active" on public.hosting_plans;
create policy "hosting_plans_select_active"
  on public.hosting_plans
  for select
  using (is_active = true);

drop policy if exists "addons_select_active" on public.addons;
create policy "addons_select_active"
  on public.addons
  for select
  using (is_active = true);


-- ============================================================
-- 0002_domains.sql
-- ============================================================
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


-- ============================================================
-- 0003_auth_otp.sql
-- ============================================================
-- =============================================================================
-- 0003_auth_otp.sql
-- Step 3: Authentication system foundation — email OTP verification for
-- registration and password reset.
--
-- Safe to run once against a project that already has 0001_foundation.sql
-- and 0002_domains.sql applied (idempotent guards included).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- email_otps
-- One row per OTP issued. Never stores the raw code — only a salted hash.
-- Accessed exclusively through the service-role client from trusted server
-- code (API route handlers under app/api/auth/**); RLS is enabled with no
-- policies so anon/authenticated roles have zero direct access.
-- -----------------------------------------------------------------------------
create table if not exists public.email_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  purpose text not null check (purpose in ('registration', 'password_reset')),
  otp_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Fast lookup of the current live OTP for an email+purpose pair.
create index if not exists idx_email_otps_email_purpose
  on public.email_otps (email, purpose, created_at desc);

-- Supports rate-limit checks ("how many OTPs has this email requested
-- recently") without a full table scan.
create index if not exists idx_email_otps_email_purpose_created_at
  on public.email_otps (email, purpose, created_at);

alter table public.email_otps enable row level security;
-- Intentionally no policies: this table is only ever touched via the
-- service-role client (lib/supabase/admin.ts), which bypasses RLS. No
-- anon/authenticated policy is defined, so PostgREST/browser access is
-- denied by default.

-- -----------------------------------------------------------------------------
-- Housekeeping: let Postgres reclaim expired/used OTP rows automatically
-- instead of relying on an external cron job. Cheap to run opportunistically
-- since email_otps stays small; called from the OTP-issuing code path.
-- -----------------------------------------------------------------------------
create or replace function public.purge_expired_email_otps()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.email_otps
  where expires_at < now() - interval '1 day'
     or used_at is not null and used_at < now() - interval '1 day';
end;
$$;


-- ============================================================
-- 0004_cart.sql
-- ============================================================
-- =============================================================================
-- 0004_cart.sql
-- Step 4: Shopping cart — one row per domain a signed-in user has added to
-- their cart via the domain Claim flow (app/domains/search).
--
-- Guest (pre-login) cart state is intentionally NOT modeled here — it lives
-- client-side in an httpOnly cookie (see lib/cart/guest-cart.ts) and is
-- merged into this table on the first authenticated request after login
-- (see lib/cart/cart-service.ts). Nothing about the guest cart ever
-- bypasses the checks below: merge re-validates availability and
-- re-computes price exactly like a normal authenticated add.
--
-- Safe to run once against a project that already has 0001_foundation.sql
-- and 0002_domains.sql applied (idempotent guards included).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- cart_items
-- Intentionally minimal for this stage — checkout, orders, hosting
-- selection, and add-ons are future steps and are not modeled here.
-- `price`/`currency` are captured at add-to-cart time from the server-side
-- pricing module (never a client-supplied value) so the cart shows a
-- stable price rather than one that could drift or be spoofed.
-- -----------------------------------------------------------------------------
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  domain_name text not null,
  price numeric(10, 2) not null check (price >= 0),
  currency text not null default 'USD',
  validity_years int not null default 1 check (validity_years > 0),
  created_at timestamptz not null default now(),
  -- One cart row per domain per user — the DB-level backstop for duplicate
  -- prevention (the API also checks before insert, but this is the real
  -- guarantee under concurrent requests).
  unique (owner_id, domain_name)
);

create index if not exists idx_cart_items_owner_id on public.cart_items (owner_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.cart_items enable row level security;

-- A user may only see, add to, and remove from their own cart. No update
-- policy is defined — items are removed and re-added rather than edited,
-- since there's nothing on the row yet that a user should be able to
-- change in place.
drop policy if exists "cart_items_select_own" on public.cart_items;
create policy "cart_items_select_own"
  on public.cart_items
  for select
  using (auth.uid() = owner_id);

drop policy if exists "cart_items_insert_own" on public.cart_items;
create policy "cart_items_insert_own"
  on public.cart_items
  for insert
  with check (auth.uid() = owner_id);

drop policy if exists "cart_items_delete_own" on public.cart_items;
create policy "cart_items_delete_own"
  on public.cart_items
  for delete
  using (auth.uid() = owner_id);


-- ============================================================
-- 0005_orders.sql
-- ============================================================
-- =============================================================================
-- 0005_orders.sql
-- Checkout order creation foundation.
-- Creates orders, order items and invoices so the final checkout step can
-- persist a real order instead of only showing a confirmation message.
-- =============================================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users (id) on delete cascade,
  order_number text not null unique,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'processing', 'active', 'completed', 'cancelled', 'failed')),
  currency text not null default 'BDT',
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  hosting_plan_id text,
  hosting_plan_name text,
  hosting_price numeric(12,2) not null default 0,
  hosting_billing_cycle text,
  custom_nameserver text,
  custom_ip_address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_type text not null check (item_type in ('domain', 'addon')),
  item_id text,
  name text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order_id on public.order_items(order_id);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  invoice_number text not null unique,
  status text not null default 'unpaid'
    check (status in ('unpaid', 'paid', 'cancelled', 'refunded')),
  currency text not null default 'BDT',
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoices_customer_id on public.invoices(customer_id);
create index if not exists idx_invoices_status on public.invoices(status);

create or replace function public.generate_order_number()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));
    exit when not exists (select 1 from public.orders where order_number = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function public.generate_invoice_number()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));
    exit when not exists (select 1 from public.invoices where invoice_number = candidate);
  end loop;
  return candidate;
end;
$$;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_invoices_updated_at on public.invoices;
create trigger trg_invoices_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.invoices enable row level security;

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders for select using (auth.uid() = customer_id);

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items for select
using (exists (select 1 from public.orders o where o.id = order_items.order_id and o.customer_id = auth.uid()));

drop policy if exists "invoices_select_own" on public.invoices;
create policy "invoices_select_own" on public.invoices for select using (auth.uid() = customer_id);


-- ============================================================
-- 0006_services_tickets.sql
-- ============================================================
-- =============================================================================
-- 0006_services_tickets.sql
-- Turns dashboard Services and Support Tickets into real user-owned data.
-- =============================================================================

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  ticket_number text not null unique,
  subject text not null check (char_length(trim(subject)) between 3 and 200),
  message text not null check (char_length(trim(message)) between 5 and 5000),
  status text not null default 'open' check (status in ('open','pending','resolved','closed')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_tickets_customer_id on public.support_tickets(customer_id);
create index if not exists idx_support_tickets_status on public.support_tickets(status);
create index if not exists idx_support_tickets_created_at on public.support_tickets(created_at desc);

create or replace function public.generate_ticket_number()
returns text
language plpgsql
as $$
declare candidate text;
begin
  loop
    candidate := 'TKT-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));
    exit when not exists (select 1 from public.support_tickets where ticket_number = candidate);
  end loop;
  return candidate;
end;
$$;

drop trigger if exists trg_support_tickets_updated_at on public.support_tickets;
create trigger trg_support_tickets_updated_at before update on public.support_tickets
for each row execute function public.set_updated_at();

alter table public.support_tickets enable row level security;
drop policy if exists "support_tickets_select_own" on public.support_tickets;
create policy "support_tickets_select_own" on public.support_tickets for select using (auth.uid() = customer_id);

drop policy if exists "support_tickets_insert_own" on public.support_tickets;
create policy "support_tickets_insert_own" on public.support_tickets for insert with check (auth.uid() = customer_id);


-- ============================================================
-- 0007_payments.sql
-- ============================================================
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


-- ============================================================
-- 0008_dns.sql
-- ============================================================
-- =============================================================================
-- 0008_dns.sql
-- DNS records + nameserver management foundation.
-- =============================================================================

alter table public.domains
  add column if not exists nameserver1 text,
  add column if not exists nameserver2 text,
  add column if not exists nameserver3 text,
  add column if not exists nameserver4 text;

create table if not exists public.dns_records (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('A','AAAA','CNAME','MX','TXT','NS')),
  name text not null,
  content text not null,
  ttl integer not null default 3600 check (ttl between 60 and 86400),
  priority integer check (priority is null or priority between 0 and 65535),
  cloudflare_record_id text,
  status text not null default 'pending' check (status in ('pending','active','failed','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dns_records_domain_id on public.dns_records(domain_id);
create index if not exists idx_dns_records_owner_id on public.dns_records(owner_id);

alter table public.dns_records enable row level security;
drop policy if exists "dns_records_select_own" on public.dns_records;
create policy "dns_records_select_own" on public.dns_records for select using (auth.uid() = owner_id);

drop policy if exists "dns_records_insert_own" on public.dns_records;
create policy "dns_records_insert_own" on public.dns_records for insert with check (auth.uid() = owner_id);

drop policy if exists "dns_records_update_own" on public.dns_records;
create policy "dns_records_update_own" on public.dns_records for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "dns_records_delete_own" on public.dns_records;
create policy "dns_records_delete_own" on public.dns_records for delete using (auth.uid() = owner_id);

drop trigger if exists trg_dns_records_updated_at on public.dns_records;
create trigger trg_dns_records_updated_at before update on public.dns_records
for each row execute function public.set_updated_at();


-- ============================================================
-- 0009_admin_audit.sql
-- ============================================================
-- Admin audit trail. Run after 0008_dns.sql.
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_admin_audit_created_at on public.admin_audit_logs(created_at desc);
create index if not exists idx_admin_audit_admin_id on public.admin_audit_logs(admin_id);
alter table public.admin_audit_logs enable row level security;


-- ============================================================
-- 0010_email_logs.sql
-- ============================================================
-- Phase 7: auditable email notification log.
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  to_email text not null,
  subject text not null,
  event text not null,
  status text not null default 'queued' check (status in ('queued','sent','failed')),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists idx_email_logs_user_id on public.email_logs(user_id);
create index if not exists idx_email_logs_event on public.email_logs(event);
create index if not exists idx_email_logs_created_at on public.email_logs(created_at desc);
alter table public.email_logs enable row level security;
-- Email logs are server-managed; users do not receive direct table access.


-- ============================================================
-- 0011_desec_dns_provider.sql
-- ============================================================
-- =============================================================================
-- 0011_desec_dns_provider.sql
-- Provider-neutral DNS record identifier.
-- Idempotent: safe to run on a fresh database or one where an earlier migration
-- has already created/renamed the column.
-- =============================================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'dns_records'
      and column_name = 'cloudflare_record_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'dns_records'
      and column_name = 'provider_record_id'
  ) then
    alter table public.dns_records
      rename column cloudflare_record_id to provider_record_id;
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'dns_records'
      and column_name = 'cloudflare_record_id'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'dns_records'
      and column_name = 'provider_record_id'
  ) then
    update public.dns_records
      set provider_record_id = coalesce(provider_record_id, cloudflare_record_id)
      where cloudflare_record_id is not null;
    alter table public.dns_records drop column cloudflare_record_id;
  elsif not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'dns_records'
      and column_name = 'provider_record_id'
  ) then
    alter table public.dns_records add column provider_record_id text;
  end if;
end $$;

-- ============================================================
-- 0012_manual_payments.sql
-- ============================================================
-- Manual bKash/Nagad/Rocket payment review migration.
alter table public.payments add column if not exists sender_number text;
alter table public.payments add column if not exists reviewed_at timestamptz;
alter table public.payments add column if not exists reviewed_by uuid references auth.users(id) on delete set null;
alter table public.payments alter column gateway set default 'manual';


-- ============================================================
-- 0013_bootstrap_admin.sql
-- ============================================================
-- Run once in Supabase SQL Editor to grant admin access to your own account.
-- Replace the email below before running.
-- This is intentionally separate from normal user registration.
update public.profiles
set role = 'admin'
where lower(email) = lower('rabbiahmedfahim44@gmail.com');

-- Coupon management and redemption.
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  min_order_amount numeric(12,2) not null default 0 check (min_order_amount >= 0),
  max_discount_amount numeric(12,2),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  usage_count integer not null default 0 check (usage_count >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (max_discount_amount is null or max_discount_amount >= 0),
  check (discount_type <> 'percent' or discount_value <= 100),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index if not exists idx_coupons_code on public.coupons(lower(code));
create index if not exists idx_coupons_active on public.coupons(active);

drop trigger if exists trg_coupons_updated_at on public.coupons;
create trigger trg_coupons_updated_at before update on public.coupons
for each row execute function public.set_updated_at();

alter table public.coupons enable row level security;

-- Public/customer clients do not get direct coupon table access. Server routes
-- validate coupons with the service-role client and expose only safe fields.

alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists coupon_discount numeric(12,2) not null default 0;

create or replace function public.redeem_coupon(p_code text, p_order_total numeric)
returns table(valid boolean, discount numeric, normalized_code text, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.coupons%rowtype;
  d numeric(12,2);
  now_ts timestamptz := now();
begin
  select * into c from public.coupons
  where lower(code) = lower(trim(p_code))
  for update;

  if not found then
    return query select false, 0::numeric, null::text, 'Coupon code not found.'::text;
    return;
  end if;
  if not c.active then
    return query select false, 0::numeric, c.code, 'This coupon is disabled.'::text;
    return;
  end if;
  if c.starts_at is not null and now_ts < c.starts_at then
    return query select false, 0::numeric, c.code, 'This coupon is not active yet.'::text;
    return;
  end if;
  if c.ends_at is not null and now_ts > c.ends_at then
    return query select false, 0::numeric, c.code, 'This coupon has expired.'::text;
    return;
  end if;
  if c.usage_limit is not null and c.usage_count >= c.usage_limit then
    return query select false, 0::numeric, c.code, 'This coupon has reached its usage limit.'::text;
    return;
  end if;
  if p_order_total < c.min_order_amount then
    return query select false, 0::numeric, c.code, ('Minimum order amount is ' || c.min_order_amount::text || ' BDT.')::text;
    return;
  end if;

  if c.discount_type = 'percent' then
    d := round((p_order_total * c.discount_value / 100)::numeric, 2);
  else
    d := round(c.discount_value, 2);
  end if;
  if c.max_discount_amount is not null then d := least(d, c.max_discount_amount); end if;
  d := greatest(0, least(d, p_order_total));

  update public.coupons set usage_count = usage_count + 1 where id = c.id;
  return query select true, d, c.code, 'Coupon applied.'::text;
end;
$$;

revoke all on function public.redeem_coupon(text, numeric) from public;
revoke all on function public.redeem_coupon(text, numeric) from anon;
revoke all on function public.redeem_coupon(text, numeric) from authenticated;
grant execute on function public.redeem_coupon(text, numeric) to service_role;

-- Admin-managed manual payment settings. This avoids redeploying just to change
-- bKash/Nagad/Rocket receiving numbers.
create table if not exists public.payment_settings (
  id boolean primary key default true check (id),
  bkash_number text not null default '',
  nagad_number text not null default '',
  rocket_number text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.payment_settings(id,bkash_number,nagad_number,rocket_number)
values(true, coalesce(current_setting('app.payment_bkash', true), ''), coalesce(current_setting('app.payment_nagad', true), ''), coalesce(current_setting('app.payment_rocket', true), ''))
on conflict (id) do nothing;

alter table public.payment_settings enable row level security;
drop policy if exists "payment_settings_no_direct_access" on public.payment_settings;
create policy "payment_settings_no_direct_access" on public.payment_settings for all using (false) with check (false);


-- ============================================================
-- 0016_profile_and_avatars.sql
-- ============================================================
-- 0016_profile_and_avatars.sql
-- Profile editing + profile pictures.
-- Safe to run after the existing migrations.

alter table public.profiles
  add column if not exists avatar_url text;

-- Keep role/customer_id/email protected, but allow a user to edit their
-- own mobile number from the Profile page.
create or replace function public.enforce_profile_immutable_fields()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and coalesce(current_setting('app.allow_profile_role_change', true), 'off') <> 'on' then
    raise exception 'role cannot be changed directly';
  end if;

  if new.customer_id is distinct from old.customer_id then
    raise exception 'customer_id cannot be changed';
  end if;

  if new.email is distinct from old.email then
    raise exception 'email cannot be changed directly';
  end if;

  return new;
end;
$$;

-- Public avatar bucket. The object path is always <auth-user-id>/avatar.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================================================
-- Appended from database/0018_full_requirements.sql (was missing from this
-- consolidated installer). Adds account_status (used for banning customers),
-- domain status history, service messaging, ticket replies, dashboard content
-- tables, and the expiry maintenance function.
-- =============================================================================

-- SITES.BD full requirements extension.
-- Adds audit/history, dashboard content, service messaging, ticket replies,
-- TXT workflow metadata, and configuration without replacing existing tables.

alter table public.profiles add column if not exists account_status text not null default 'active';
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists country text default 'BD';

alter table public.domains add column if not exists verification_status text not null default 'waiting';
alter table public.domains add column if not exists hosting_type text;
alter table public.domains add column if not exists registration_price numeric(12,2) default 0;
alter table public.domains add column if not exists renewal_price numeric(12,2) default 0;
alter table public.domains add column if not exists dns_mode text not null default 'nameserver';
alter table public.domains add column if not exists info jsonb not null default '{}'::jsonb;

create table if not exists public.domain_status_logs (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains(id) on delete cascade,
  changed_by uuid references auth.users(id) on delete set null,
  old_status text,
  new_status text not null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists idx_domain_status_logs_domain on public.domain_status_logs(domain_id, created_at desc);

create table if not exists public.service_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  message text not null check (char_length(trim(message)) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists idx_service_messages_order on public.service_messages(order_id, created_at);

create table if not exists public.support_ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  is_admin boolean not null default false,
  message text not null check (char_length(trim(message)) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists idx_ticket_replies_ticket on public.support_ticket_replies(ticket_id, created_at);

alter table public.support_tickets add column if not exists whatsapp_number text;
alter table public.support_tickets add column if not exists related_domain_id uuid references public.domains(id) on delete set null;
alter table public.support_tickets add column if not exists related_order_id uuid references public.orders(id) on delete set null;

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  link_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_banners_active_sort on public.banners(active, sort_order);

create table if not exists public.faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  icon text,
  active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.app_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.system_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_system_audit_created on public.system_audit_logs(created_at desc);
create index if not exists idx_system_audit_entity on public.system_audit_logs(entity_type, entity_id);

alter table public.domain_status_logs enable row level security;
alter table public.service_messages enable row level security;
alter table public.support_ticket_replies enable row level security;
alter table public.banners enable row level security;
alter table public.faq_items enable row level security;
alter table public.social_links enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.app_config enable row level security;
alter table public.system_audit_logs enable row level security;

-- Public read-only content. Writes are server/admin only.
drop policy if exists banners_public_read on public.banners;
create policy banners_public_read on public.banners for select using (active = true);
drop policy if exists faq_public_read on public.faq_items;
create policy faq_public_read on public.faq_items for select using (active = true);
drop policy if exists social_public_read on public.social_links;
create policy social_public_read on public.social_links for select using (active = true);

-- User-owned service/ticket conversations.
drop policy if exists service_messages_own_read on public.service_messages;
create policy service_messages_own_read on public.service_messages for select using (auth.uid() = user_id);
drop policy if exists ticket_replies_own_read on public.support_ticket_replies;
create policy ticket_replies_own_read on public.support_ticket_replies for select using (
  exists (select 1 from public.support_tickets t where t.id = ticket_id and t.customer_id = auth.uid())
);
drop policy if exists ticket_replies_own_insert on public.support_ticket_replies;
create policy ticket_replies_own_insert on public.support_ticket_replies for insert with check (
  auth.uid() = user_id and exists (select 1 from public.support_tickets t where t.id = ticket_id and t.customer_id = auth.uid() and t.status <> 'closed')
);

create or replace function public.expire_subscription_records()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.domains set status = 'expired', updated_at = now()
  where expires_at is not null and expires_at::date < current_date and status <> 'expired';

  update public.orders set status = 'completed', updated_at = now()
  where status in ('active','processing') and false;
end;
$$;
revoke all on function public.expire_subscription_records() from public;
grant execute on function public.expire_subscription_records() to service_role;

-- 0020_admin_features.sql
-- Admin notification center, general site config, reports helpers and customer activity.

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  kind text not null default 'info' check (kind in ('info','success','warning','danger','promotion')),
  link text,
  is_read boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_user_notifications_user_created on public.user_notifications(user_id, created_at desc);
create index if not exists idx_user_notifications_unread on public.user_notifications(user_id, is_read, created_at desc);
alter table public.user_notifications enable row level security;

drop policy if exists "user_notifications_select_own" on public.user_notifications;
create policy "user_notifications_select_own" on public.user_notifications for select using (auth.uid() = user_id);
drop policy if exists "user_notifications_update_own" on public.user_notifications;
create policy "user_notifications_update_own" on public.user_notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- General configuration store. All writes are server/admin controlled.
insert into public.app_config(key, value)
values
  ('site_settings', '{"maintenance":false,"default_currency":"BDT","support_whatsapp":"","support_email":"","site_notice":""}'::jsonb),
  ('admin_preferences', '{"compact_tables":false,"refresh_seconds":60}'::jsonb)
on conflict (key) do nothing;

create index if not exists idx_admin_audit_action on public.admin_audit_logs(action);

-- Optional customer-facing notification preference table.
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  marketing_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
drop policy if exists "notification_preferences_own" on public.notification_preferences;
create policy "notification_preferences_own" on public.notification_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- 0021: allow common DNS record types used by modern hosting providers.
alter table public.dns_records drop constraint if exists dns_records_type_check;
alter table public.dns_records drop constraint if exists dns_records_type_check1;
alter table public.dns_records add constraint dns_records_type_check check (type in ('A','AAAA','CNAME','MX','TXT','NS','SRV','CAA','HTTPS','TLSA'));
