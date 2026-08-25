-- 0020_admin_features.sql
-- Admin notification center, general site config, reports helpers and customer activity.

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  kind text not null default 'info' check (kind in ('info','success','warning','danger','promotion')),
  link text,
  is_read boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_user_notifications_user_created on public.user_notifications(user_id, created_at desc);
create index if not exists idx_user_notifications_unread on public.user_notifications(user_id, is_read, created_at desc);
alter table public.user_notifications enable row level security;

drop policy if exists "user_notifications_select_own" on public.user_notifications;
create policy "user_notifications_select_own" on public.user_notifications for select using (auth.uid() = user_id);
drop policy if exists "user_notifications_update_own" on public.user_notifications;
create policy "user_notifications_update_own" on public.user_notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- General configuration store. All writes are server/admin controlled.
insert into public.app_config(key, value)
values
  ('site_settings', '{"maintenance":false,"default_currency":"BDT","support_whatsapp":"","support_email":"","site_notice":""}'::jsonb),
  ('admin_preferences', '{"compact_tables":false,"refresh_seconds":60}'::jsonb)
on conflict (key) do nothing;

create index if not exists idx_admin_audit_action on public.admin_audit_logs(action);

-- Optional customer-facing notification preference table.
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  marketing_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
drop policy if exists "notification_preferences_own" on public.notification_preferences;
create policy "notification_preferences_own" on public.notification_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
