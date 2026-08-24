-- Promote an existing profile to admin.
-- Run this entire block in Supabase SQL Editor.

begin;

set local app.allow_profile_role_change = 'on';

update public.profiles
set role = 'admin'
where lower(email) = lower('rabbiahmedfahim44@gmail.com');

select id, email, role
from public.profiles
where lower(email) = lower('rabbiahmedfahim44@gmail.com');

commit;
