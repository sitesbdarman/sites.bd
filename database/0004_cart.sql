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
  currency text not null default 'BDT',
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
