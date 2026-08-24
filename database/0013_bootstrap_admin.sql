-- Run after the numbered migrations above.
-- There is NO public Admin Login button. Only a user whose profile role is
-- already 'admin' sees the Admin Login entry inside the normal dashboard.
-- Replace the email below with your admin account email before running.

update public.profiles
set role = 'admin'
where lower(email) = lower('rabbiahmedfahim44@gmail.com');
