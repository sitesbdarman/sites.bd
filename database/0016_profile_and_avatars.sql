-- 0016_profile_and_avatars.sql
-- Profile editing + profile pictures.
-- Safe to run after the existing migrations.

alter table public.profiles
  add column if not exists avatar_url text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Harden profile updates. Protected fields are restored instead of raising an
-- error when a normal profile update touches the row. This prevents harmless
-- avatar/name/address updates from failing because of an older trigger.
-- Admin promotion is explicitly allowed only inside a transaction that sets
-- app.allow_profile_role_change = 'on'.
create or replace function public.enforce_profile_immutable_fields()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role then
    if coalesce(current_setting('app.allow_profile_role_change', true), 'off') = 'on' then
      -- Explicitly authorized admin operation.
      null;
    else
      new.role := old.role;
    end if;
  end if;

  if new.customer_id is distinct from old.customer_id then
    new.customer_id := old.customer_id;
  end if;

  if new.email is distinct from old.email then
    new.email := old.email;
  end if;

  -- Mobile number is intentionally editable from the user's Profile page.
  return new;
end;
$$;

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
