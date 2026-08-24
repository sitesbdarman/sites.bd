-- Phase 7: auditable email notification log.
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  to_email text not null,
  subject text not null,
  event text not null,
  status text not null default 'queued' check (status in ('queued','sent','failed')),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists idx_email_logs_user_id on public.email_logs(user_id);
create index if not exists idx_email_logs_event on public.email_logs(event);
create index if not exists idx_email_logs_created_at on public.email_logs(created_at desc);
alter table public.email_logs enable row level security;
-- Email logs are server-managed; users do not receive direct table access.
