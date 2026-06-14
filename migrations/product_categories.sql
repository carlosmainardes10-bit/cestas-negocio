-- Categorias customizadas de produtos por usuário
-- Aplicar no Supabase Dashboard → SQL Editor

create table if not exists product_categories (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references users(id) on delete cascade,
  name       text        not null,
  slug       text        not null,
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);

alter table product_categories enable row level security;

create policy "Users manage own categories"
  on product_categories
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
