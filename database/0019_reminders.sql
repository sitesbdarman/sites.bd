-- =============================================================================
-- 0019_reminders.sql
-- Tracking columns so the new reminder cron jobs (domain-expiry reminders,
-- cart-abandonment reminders) never send the same email to the same person
-- twice. Safe to run once against a project that already has
-- 0002_domains.sql and 0004_cart.sql applied (idempotent guards included).
-- =============================================================================

-- Highest reminder threshold (in days-before-expiry) already emailed for a
-- domain: 30, 15, 7, or 0 (expired-today notice). Null/0 = nothing sent yet.
-- Storing the threshold (not a boolean) lets the cron move through
-- 30 -> 15 -> 7 as time passes without re-sending an earlier stage.
alter table public.domains
  add column if not exists last_expiry_reminder_stage int;

-- When a "you left something in your cart" email was last sent for this
-- item, so the cron can skip rows it already reminded about.
alter table public.cart_items
  add column if not exists abandonment_reminder_sent_at timestamptz;

create index if not exists idx_domains_expires_at on public.domains (expires_at)
  where status = 'active';
