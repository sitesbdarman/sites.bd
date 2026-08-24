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
