-- SITES.BD full requirements extension.
-- Adds audit/history, dashboard content, service messaging, ticket replies,
-- TXT workflow metadata, and configuration without replacing existing tables.

alter table public.profiles add column if not exists account_status text not null default 'active';
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists country text default 'BD';

alter table public.domains add column if not exists verification_status text not null default 'waiting';
alter table public.domains add column if not exists hosting_type text;
alter table public.domains add column if not exists registration_price numeric(12,2) default 0;
alter table public.domains add column if not exists renewal_price numeric(12,2) default 0;
alter table public.domains add column if not exists dns_mode text not null default 'nameserver';
alter table public.domains add column if not exists info jsonb not null default '{}'::jsonb;

create table if not exists public.domain_status_logs (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains(id) on delete cascade,
  changed_by uuid references auth.users(id) on delete set null,
  old_status text,
  new_status text not null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists idx_domain_status_logs_domain on public.domain_status_logs(domain_id, created_at desc);

create table if not exists public.service_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  message text not null check (char_length(trim(message)) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists idx_service_messages_order on public.service_messages(order_id, created_at);

create table if not exists public.support_ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  is_admin boolean not null default false,
  message text not null check (char_length(trim(message)) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists idx_ticket_replies_ticket on public.support_ticket_replies(ticket_id, created_at);

alter table public.support_tickets add column if not exists whatsapp_number text;
alter table public.support_tickets add column if not exists related_domain_id uuid references public.domains(id) on delete set null;
alter table public.support_tickets add column if not exists related_order_id uuid references public.orders(id) on delete set null;

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  link_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_banners_active_sort on public.banners(active, sort_order);

create table if not exists public.faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  icon text,
  active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.app_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.system_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_system_audit_created on public.system_audit_logs(created_at desc);
create index if not exists idx_system_audit_entity on public.system_audit_logs(entity_type, entity_id);

alter table public.domain_status_logs enable row level security;
alter table public.service_messages enable row level security;
alter table public.support_ticket_replies enable row level security;
alter table public.banners enable row level security;
alter table public.faq_items enable row level security;
alter table public.social_links enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.app_config enable row level security;
alter table public.system_audit_logs enable row level security;

-- Public read-only content. Writes are server/admin only.
drop policy if exists banners_public_read on public.banners;
create policy banners_public_read on public.banners for select using (active = true);
drop policy if exists faq_public_read on public.faq_items;
create policy faq_public_read on public.faq_items for select using (active = true);
drop policy if exists social_public_read on public.social_links;
create policy social_public_read on public.social_links for select using (active = true);

-- User-owned service/ticket conversations.
drop policy if exists service_messages_own_read on public.service_messages;
create policy service_messages_own_read on public.service_messages for select using (auth.uid() = user_id);
drop policy if exists ticket_replies_own_read on public.support_ticket_replies;
create policy ticket_replies_own_read on public.support_ticket_replies for select using (
  exists (select 1 from public.support_tickets t where t.id = ticket_id and t.customer_id = auth.uid())
);
drop policy if exists ticket_replies_own_insert on public.support_ticket_replies;
create policy ticket_replies_own_insert on public.support_ticket_replies for insert with check (
  auth.uid() = user_id and exists (select 1 from public.support_tickets t where t.id = ticket_id and t.customer_id = auth.uid() and t.status <> 'closed')
);

create or replace function public.expire_subscription_records()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.domains set status = 'expired', updated_at = now()
  where expires_at is not null and expires_at::date < current_date and status <> 'expired';

  update public.orders set status = 'completed', updated_at = now()
  where status in ('active','processing') and false;
end;
$$;
revoke all on function public.expire_subscription_records() from public;
grant execute on function public.expire_subscription_records() to service_role;

