-- orders: basket_name, cost, delivery_time (idempotent)
alter table public.orders
  add column if not exists basket_name text,
  add column if not exists cost numeric not null default 0,
  add column if not exists delivery_time text;

-- catalog_items: photos array
alter table public.catalog_items
  add column if not exists images text[] not null default '{}';

-- storage bucket for catalog photos
insert into storage.buckets (id, name, public)
values ('catalog-images', 'catalog-images', true)
on conflict (id) do nothing;

create policy "Users upload own catalog images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'catalog-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Public view catalog images"
  on storage.objects for select
  using (bucket_id = 'catalog-images');

create policy "Users delete own catalog images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'catalog-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
