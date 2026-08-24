-- Manual bKash/Nagad/Rocket payment review migration.
alter table public.payments add column if not exists sender_number text;
alter table public.payments add column if not exists reviewed_at timestamptz;
alter table public.payments add column if not exists reviewed_by uuid references auth.users(id) on delete set null;
alter table public.payments alter column gateway set default 'manual';
