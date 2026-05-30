create table if not exists coupons (
  id uuid default gen_random_uuid() primary key,
  stripe_coupon_id text not null,
  stripe_promotion_code_id text not null,
  code text not null,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric not null,
  applicable_plans text[] not null default '{basic,premium}',
  max_redemptions integer,
  redeem_by timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists coupon_usages (
  id uuid default gen_random_uuid() primary key,
  coupon_id uuid not null references coupons(id) on delete cascade,
  user_email text not null,
  redeemed_at timestamptz not null default now()
);
