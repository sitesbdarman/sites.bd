-- SITES.BD admin bootstrap
-- Run this once in Supabase SQL Editor after the profiles table exists.
-- It uses a transaction-local flag so the normal profile immutability trigger
-- stays enabled and ordinary users still cannot change their role.

begin;

set local app.allow_profile_role_change = 'on';

update public.profiles
set role = 'admin'
where lower(email) = lower('rabbiahmedfahim44@gmail.com');

commit;
