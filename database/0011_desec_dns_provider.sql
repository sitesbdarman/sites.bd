-- =============================================================================
-- 0011_desec_dns_provider.sql
-- Replace the old provider-specific DNS record identifier with a provider-neutral
-- identifier. Existing values are preserved during the rename.
-- =============================================================================

alter table public.dns_records
  rename column cloudflare_record_id to provider_record_id;
