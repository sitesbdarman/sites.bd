-- =============================================================================
-- 0006_services_tickets.sql
-- Turns dashboard Services and Support Tickets into real user-owned data.
-- =============================================================================

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  ticket_number text not null unique,
  subject text not null check (char_length(trim(subject)) between 3 and 200),
  message text not null check (char_length(trim(message)) between 5 and 5000),
  status text not null default 'open' check (status in ('open','pending','resolved','closed')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_tickets_customer_id on public.support_tickets(customer_id);
create index if not exists idx_support_tickets_status on public.support_tickets(status);
create index if not exists idx_support_tickets_created_at on public.support_tickets(created_at desc);

create or replace function public.generate_ticket_number()
returns text
language plpgsql
as $$
declare candidate text;
begin
  loop
    candidate := 'TKT-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));
    exit when not exists (select 1 from public.support_tickets where ticket_number = candidate);
  end loop;
  return candidate;
end;
$$;

drop trigger if exists trg_support_tickets_updated_at on public.support_tickets;
create trigger trg_support_tickets_updated_at before update on public.support_tickets
for each row execute function public.set_updated_at();

alter table public.support_tickets enable row level security;
drop policy if exists "support_tickets_select_own" on public.support_tickets;
create policy "support_tickets_select_own" on public.support_tickets for select using (auth.uid() = customer_id);

drop policy if exists "support_tickets_insert_own" on public.support_tickets;
create policy "support_tickets_insert_own" on public.support_tickets for insert with check (auth.uid() = customer_id);
