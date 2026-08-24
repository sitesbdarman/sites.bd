-- Coupon management and redemption.
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  min_order_amount numeric(12,2) not null default 0 check (min_order_amount >= 0),
  max_discount_amount numeric(12,2),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  usage_count integer not null default 0 check (usage_count >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (max_discount_amount is null or max_discount_amount >= 0),
  check (discount_type <> 'percent' or discount_value <= 100),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index if not exists idx_coupons_code on public.coupons(lower(code));
create index if not exists idx_coupons_active on public.coupons(active);

drop trigger if exists trg_coupons_updated_at on public.coupons;
create trigger trg_coupons_updated_at before update on public.coupons
for each row execute function public.set_updated_at();

alter table public.coupons enable row level security;

-- Public/customer clients do not get direct coupon table access. Server routes
-- validate coupons with the service-role client and expose only safe fields.

alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists coupon_discount numeric(12,2) not null default 0;

create or replace function public.redeem_coupon(p_code text, p_order_total numeric)
returns table(valid boolean, discount numeric, normalized_code text, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.coupons%rowtype;
  d numeric(12,2);
  now_ts timestamptz := now();
begin
  select * into c from public.coupons
  where lower(code) = lower(trim(p_code))
  for update;

  if not found then
    return query select false, 0::numeric, null::text, 'Coupon code not found.'::text;
    return;
  end if;
  if not c.active then
    return query select false, 0::numeric, c.code, 'This coupon is disabled.'::text;
    return;
  end if;
  if c.starts_at is not null and now_ts < c.starts_at then
    return query select false, 0::numeric, c.code, 'This coupon is not active yet.'::text;
    return;
  end if;
  if c.ends_at is not null and now_ts > c.ends_at then
    return query select false, 0::numeric, c.code, 'This coupon has expired.'::text;
    return;
  end if;
  if c.usage_limit is not null and c.usage_count >= c.usage_limit then
    return query select false, 0::numeric, c.code, 'This coupon has reached its usage limit.'::text;
    return;
  end if;
  if p_order_total < c.min_order_amount then
    return query select false, 0::numeric, c.code, ('Minimum order amount is ' || c.min_order_amount::text || ' BDT.')::text;
    return;
  end if;

  if c.discount_type = 'percent' then
    d := round((p_order_total * c.discount_value / 100)::numeric, 2);
  else
    d := round(c.discount_value, 2);
  end if;
  if c.max_discount_amount is not null then d := least(d, c.max_discount_amount); end if;
  d := greatest(0, least(d, p_order_total));

  update public.coupons set usage_count = usage_count + 1 where id = c.id;
  return query select true, d, c.code, 'Coupon applied.'::text;
end;
$$;

revoke all on function public.redeem_coupon(text, numeric) from public;
revoke all on function public.redeem_coupon(text, numeric) from anon;
revoke all on function public.redeem_coupon(text, numeric) from authenticated;
grant execute on function public.redeem_coupon(text, numeric) to service_role;
