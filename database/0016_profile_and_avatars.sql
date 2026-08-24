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
