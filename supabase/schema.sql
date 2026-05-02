-- 商辦駝獸 — 團體購物車 schema
-- 在 Supabase SQL Editor 執行一次即可

create table if not exists groups (
  id            text primary key,
  building_id   text not null default 'B01',
  owner_user_id text not null,
  owner_name    text not null,
  owner_phone   text not null,
  status        text not null default 'open'
                check (status in ('open','closed','cancelled')),
  created_at    timestamptz not null default now(),
  closed_at     timestamptz,
  total_amount  integer
);
create index if not exists groups_status_created_idx on groups (status, created_at desc);

create table if not exists cart_items (
  id          uuid primary key default gen_random_uuid(),
  group_id    text not null references groups(id) on delete cascade,
  user_id     text not null,
  user_name   text not null,
  food_name   text not null,
  spec1       text,
  spec2       text,
  quantity    integer not null check (quantity > 0),
  unit_price  integer not null,
  product_url text,
  created_at  timestamptz not null default now()
);
create index if not exists cart_items_group_idx on cart_items (group_id);

-- Realtime
alter publication supabase_realtime add table cart_items;
alter publication supabase_realtime add table groups;

-- RLS（App 層保護 + 寬鬆 RLS；nanoid(10) 不可猜測 + status='open' 限制）
alter table groups enable row level security;
alter table cart_items enable row level security;

drop policy if exists groups_read   on groups;
drop policy if exists groups_insert on groups;
drop policy if exists groups_update on groups;
create policy groups_read   on groups for select using (true);
create policy groups_insert on groups for insert with check (true);
create policy groups_update on groups for update using (true)
  with check (status in ('closed','cancelled'));

drop policy if exists items_read   on cart_items;
drop policy if exists items_insert on cart_items;
drop policy if exists items_delete on cart_items;
create policy items_read   on cart_items for select using (true);
create policy items_insert on cart_items for insert with check (
  exists (select 1 from groups g where g.id = group_id and g.status = 'open')
);
create policy items_delete on cart_items for delete using (
  exists (select 1 from groups g where g.id = group_id and g.status = 'open')
);
