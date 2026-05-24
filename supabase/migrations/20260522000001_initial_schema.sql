-- ============================================================
-- Cestas Negócio – Schema inicial
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. TABELA DE PERFIS (estende auth.users)
-- ─────────────────────────────────────────────
create table if not exists public.users (
  id                     uuid references auth.users(id) on delete cascade primary key,
  email                  text not null,
  name                   text not null,
  plan                   text not null default 'basic'
                           check (plan in ('basic', 'premium')),
  stripe_customer_id     text,
  stripe_subscription_id text,
  created_at             timestamptz default now() not null
);

-- ─────────────────────────────────────────────
-- 2. PRODUTOS
-- ─────────────────────────────────────────────
create table if not exists public.products (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.users(id) on delete cascade not null,
  name       text not null,
  cost       numeric(10,2) not null default 0 check (cost >= 0),
  unit       text not null default 'un',
  category   text not null default 'outros',
  created_at timestamptz default now() not null
);

-- ─────────────────────────────────────────────
-- 3. CESTAS
-- ─────────────────────────────────────────────
create table if not exists public.baskets (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.users(id) on delete cascade not null,
  name       text not null,
  category   text not null
               check (category in ('romantica','premium','fitness','corporativa','economica')),
  sale_price numeric(10,2) not null default 0 check (sale_price >= 0),
  created_at timestamptz default now() not null
);

-- ─────────────────────────────────────────────
-- 4. ITENS DE CESTA
-- ─────────────────────────────────────────────
create table if not exists public.basket_items (
  id         uuid default gen_random_uuid() primary key,
  basket_id  uuid references public.baskets(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity   numeric(10,3) not null default 1 check (quantity > 0),
  unique(basket_id, product_id)
);

-- ─────────────────────────────────────────────
-- 5. TRANSAÇÕES FINANCEIRAS
-- ─────────────────────────────────────────────
create table if not exists public.transactions (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.users(id) on delete cascade not null,
  type        text not null check (type in ('in', 'out')),
  amount      numeric(10,2) not null check (amount > 0),
  description text not null,
  date        date not null,
  created_at  timestamptz default now() not null
);

-- ─────────────────────────────────────────────
-- 6. CLIENTES
-- ─────────────────────────────────────────────
create table if not exists public.customers (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.users(id) on delete cascade not null,
  name       text not null,
  phone      text not null,
  email      text not null default '',
  birth_date date,
  created_at timestamptz default now() not null
);

-- ─────────────────────────────────────────────
-- 7. CATÁLOGO DIGITAL
-- ─────────────────────────────────────────────
create table if not exists public.catalog_items (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.users(id) on delete cascade not null,
  basket_id   uuid references public.baskets(id) on delete cascade not null,
  image_url   text,
  description text not null default '',
  visible     boolean not null default true,
  created_at  timestamptz default now() not null,
  unique(user_id, basket_id)
);

-- ============================================================
-- ÍNDICES
-- ============================================================
create index if not exists idx_products_user_id     on public.products(user_id);
create index if not exists idx_baskets_user_id      on public.baskets(user_id);
create index if not exists idx_basket_items_basket  on public.basket_items(basket_id);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_date    on public.transactions(date);
create index if not exists idx_customers_user_id    on public.customers(user_id);
create index if not exists idx_catalog_user_id      on public.catalog_items(user_id);
create index if not exists idx_catalog_visible      on public.catalog_items(user_id, visible);

-- ============================================================
-- TRIGGER: cria perfil automaticamente ao cadastrar
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, name, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'basic'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Ativa RLS em todas as tabelas
alter table public.users        enable row level security;
alter table public.products     enable row level security;
alter table public.baskets      enable row level security;
alter table public.basket_items enable row level security;
alter table public.transactions enable row level security;
alter table public.customers    enable row level security;
alter table public.catalog_items enable row level security;

-- ── users ──────────────────────────────────────
create policy "users: ver próprio perfil"
  on public.users for select
  using (auth.uid() = id);

create policy "users: atualizar próprio perfil"
  on public.users for update
  using (auth.uid() = id);

-- ── products ───────────────────────────────────
create policy "products: CRUD próprio"
  on public.products for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── baskets ────────────────────────────────────
create policy "baskets: CRUD próprio"
  on public.baskets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── basket_items ───────────────────────────────
-- acesso via basket (owner check via join)
create policy "basket_items: CRUD via cesta própria"
  on public.basket_items for all
  using (
    exists (
      select 1 from public.baskets b
      where b.id = basket_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.baskets b
      where b.id = basket_id and b.user_id = auth.uid()
    )
  );

-- ── transactions ───────────────────────────────
create policy "transactions: CRUD próprio"
  on public.transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── customers ──────────────────────────────────
create policy "customers: CRUD próprio"
  on public.customers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── catalog_items ──────────────────────────────
-- proprietária gerencia tudo
create policy "catalog: CRUD próprio"
  on public.catalog_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- visitantes anônimos só leem itens visíveis (catálogo público)
create policy "catalog: leitura pública de itens visíveis"
  on public.catalog_items for select
  using (visible = true);
