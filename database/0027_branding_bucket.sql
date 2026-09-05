-- 0027_branding_bucket.sql
-- Storage bucket for admin-uploaded site branding (logo, favicon), used as
-- the Supabase Storage fallback when Cloudinary env vars are not set.
-- Uploads always go through /api/admin/branding using the service-role
-- admin client, which bypasses RLS, so no extra storage policies are
-- required here — this mirrors the 0016 avatars bucket setup.

insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do update set public = true;
