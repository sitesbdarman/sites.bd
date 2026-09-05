-- 0028_identity_verification.sql
-- Account identity verification (NID / Passport upload + admin review).
-- Safe to run after 0027_branding_bucket.sql.

alter table public.profiles
  add column if not exists identity_status text not null default 'unverified'
    check (identity_status in ('unverified', 'pending', 'verified', 'rejected'));
alter table public.profiles add column if not exists identity_verified_at timestamptz;
alter table public.profiles add column if not exists identity_rejection_reason text;

create table if not exists public.identity_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  doc_type text not null check (doc_type in ('nid', 'passport')),
  file_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text
);

create index if not exists idx_identity_verifications_user_id on public.identity_verifications (user_id);
create index if not exists idx_identity_verifications_status on public.identity_verifications (status);

alter table public.identity_verifications enable row level security;

-- Users may see and submit their own verification requests. Only the
-- service-role admin client (which bypasses RLS) can update/review them —
-- there is deliberately no update/delete policy for regular users here.
drop policy if exists "identity_verifications_select_own" on public.identity_verifications;
create policy "identity_verifications_select_own"
  on public.identity_verifications
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "identity_verifications_insert_own" on public.identity_verifications;
create policy "identity_verifications_insert_own"
  on public.identity_verifications
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Private bucket: NID/passport images should never be publicly reachable.
-- Uploads go through /api/profile/verification (user's own session, RLS
-- enforced below); admin review reads go through the service-role client
-- via a signed URL, same pattern as other admin-only storage access.
insert into storage.buckets (id, name, public)
values ('identity-documents', 'identity-documents', false)
on conflict (id) do update set public = false;

drop policy if exists "identity_docs_insert_own" on storage.objects;
create policy "identity_docs_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'identity-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "identity_docs_select_own" on storage.objects;
create policy "identity_docs_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'identity-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
