-- =============================================================================
-- 0011_desec_dns_provider.sql
-- Provider-neutral DNS record identifier.
-- Idempotent: safe to run on a fresh database or one where an earlier migration
-- has already created/renamed the column.
-- =============================================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'dns_records'
      and column_name = 'cloudflare_record_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'dns_records'
      and column_name = 'provider_record_id'
  ) then
    alter table public.dns_records
      rename column cloudflare_record_id to provider_record_id;
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'dns_records'
      and column_name = 'cloudflare_record_id'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'dns_records'
      and column_name = 'provider_record_id'
  ) then
    update public.dns_records
      set provider_record_id = coalesce(provider_record_id, cloudflare_record_id)
      where cloudflare_record_id is not null;
    alter table public.dns_records drop column cloudflare_record_id;
  elsif not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'dns_records'
      and column_name = 'provider_record_id'
  ) then
    alter table public.dns_records add column provider_record_id text;
  end if;
end $$;
