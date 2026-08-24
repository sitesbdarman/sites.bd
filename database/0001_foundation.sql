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
  if new.role is distinct from old.role then
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
