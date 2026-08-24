-- Admin-managed manual payment settings. This avoids redeploying just to change
-- bKash/Nagad/Rocket receiving numbers.
create table if not exists public.payment_settings (
  id boolean primary key default true check (id),
  bkash_number text not null default '',
  nagad_number text not null default '',
  rocket_number text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.payment_settings(id,bkash_number,nagad_number,rocket_number)
values(true, coalesce(current_setting('app.payment_bkash', true), ''), coalesce(current_setting('app.payment_nagad', true), ''), coalesce(current_setting('app.payment_rocket', true), ''))
on conflict (id) do nothing;

alter table public.payment_settings enable row level security;
drop policy if exists "payment_settings_no_direct_access" on public.payment_settings;
create policy "payment_settings_no_direct_access" on public.payment_settings for all using (false) with check (false);
