create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  recipient_name text not null,
  purchase_date date not null default current_date,
  delivery_date date not null,
  delivery_address text not null,
  card_message text,
  total_amount numeric(10,2) not null default 0,
  delivered boolean not null default false,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz default now() not null
);

alter table public.orders enable row level security;

create policy "Users manage own orders"
  on public.orders
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
