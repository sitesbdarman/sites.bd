-- 0021_fix_profile_save.sql
-- Fixes "Couldn't save your profile. Please try again." on /profile.
--
-- Root cause: an old copy of enforce_profile_immutable_fields() (from
-- 0001_foundation.sql) raises an exception whenever mobile_number changes
-- after first being set. 0016_profile_and_avatars.sql already redefines
-- this function to allow it, but if this project's live database still
-- has the old strict version active (e.g. it was set up before 0016
-- existed, or 0001 was re-run by itself), every profile update that
-- touches mobile_number fails with a 500.
--
-- Safe to run any number of times.

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

  -- Mobile number is intentionally editable from the user's Profile page.
  return new;
end;
$$;

drop trigger if exists trg_profiles_immutable_fields on public.profiles;
create trigger trg_profiles_immutable_fields
  before update on public.profiles
  for each row execute function public.enforce_profile_immutable_fields();
