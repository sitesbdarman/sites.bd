-- Admin audit trail. Run after 0008_dns.sql.
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_admin_audit_created_at on public.admin_audit_logs(created_at desc);
create index if not exists idx_admin_audit_admin_id on public.admin_audit_logs(admin_id);
alter table public.admin_audit_logs enable row level security;
