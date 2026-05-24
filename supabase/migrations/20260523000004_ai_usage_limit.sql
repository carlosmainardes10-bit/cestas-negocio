create table if not exists ai_usage (
  id         uuid    primary key default gen_random_uuid(),
  user_id    uuid    not null references auth.users(id) on delete cascade,
  year_month text    not null,
  basket_count integer not null default 0,
  unique(user_id, year_month)
);

alter table ai_usage enable row level security;

create policy "ai_usage_select" on ai_usage for select using (auth.uid() = user_id);
create policy "ai_usage_insert" on ai_usage for insert with check (auth.uid() = user_id);
create policy "ai_usage_update" on ai_usage for update using (auth.uid() = user_id);
