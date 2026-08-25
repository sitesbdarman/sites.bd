-- =============================================================================
-- 0008_dns.sql
-- DNS records + nameserver management foundation.
-- =============================================================================

alter table public.domains
  add column if not exists nameserver1 text,
  add column if not exists nameserver2 text,
  add column if not exists nameserver3 text,
  add column if not exists nameserver4 text;

create table if not exists public.dns_records (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('A','AAAA','CNAME','MX','TXT','NS','SRV','CAA','HTTPS','TLSA')),
  name text not null,
  content text not null,
  ttl integer not null default 3600 check (ttl between 60 and 86400),
  priority integer check (priority is null or priority between 0 and 65535),
  cloudflare_record_id text,
  status text not null default 'pending' check (status in ('pending','active','failed','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dns_records_domain_id on public.dns_records(domain_id);
create index if not exists idx_dns_records_owner_id on public.dns_records(owner_id);

alter table public.dns_records enable row level security;
drop policy if exists "dns_records_select_own" on public.dns_records;
create policy "dns_records_select_own" on public.dns_records for select using (auth.uid() = owner_id);

drop policy if exists "dns_records_insert_own" on public.dns_records;
create policy "dns_records_insert_own" on public.dns_records for insert with check (auth.uid() = owner_id);

drop policy if exists "dns_records_update_own" on public.dns_records;
create policy "dns_records_update_own" on public.dns_records for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "dns_records_delete_own" on public.dns_records;
create policy "dns_records_delete_own" on public.dns_records for delete using (auth.uid() = owner_id);

drop trigger if exists trg_dns_records_updated_at on public.dns_records;
create trigger trg_dns_records_updated_at before update on public.dns_records
for each row execute function public.set_updated_at();
