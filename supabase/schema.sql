-- 商辦駝獸 — 團體購物車 schema
-- 在 Supabase SQL Editor 執行一次即可

create table if not exists groups (
  id            text primary key,
  building_id   text not null default 'B01',
  owner_user_id text not null,
  owner_name    text not null,
  owner_phone   text not null,
  tax_id        text,
  status        text not null default 'open'
                check (status in ('open','closed','cancelled')),
  created_at    timestamptz not null default now(),
  closed_at     timestamptz,
  total_amount  integer,
  pickup_number integer        -- 每棟每日流水號，由 get_next_pickup_number RPC 分配
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

-- ============================================================
-- 每棟每日流水號（daily_counters）
-- ============================================================
create table if not exists daily_counters (
  building_id  text    not null,
  session_date date    not null,  -- 11:30 前算前一天；型別 DATE（非 TEXT）
  last_number  integer not null default 0,
  primary key (building_id, session_date)
);

-- get_next_pickup_number: 遞增並回傳下一個流水號（LIFF ReviewClose 呼叫）
create or replace function get_next_pickup_number(
  p_building_id text,
  p_session_date text
) returns integer as $$
declare
  v_next integer;
begin
  insert into daily_counters (building_id, session_date, last_number)
  values (p_building_id, p_session_date, 1)
  on conflict (building_id, session_date)
  do update set last_number = daily_counters.last_number + 1
  returning last_number into v_next;
  return v_next;
end;
$$ language plpgsql security definer;

-- rollback_pickup_number: 代填失敗時回滾最後一個號碼（n8n payment-ready 呼叫）
-- 保護條件：AND last_number = p_pickup_number → 只回滾最後分配的號，防止 race / 重複呼叫
create or replace function rollback_pickup_number(
  p_building_id   text,
  p_session_date  text,
  p_pickup_number integer
) returns void as $$
begin
  update daily_counters
  set last_number = last_number - 1
  where building_id  = p_building_id
    and session_date = p_session_date::date  -- TEXT 參數轉型 DATE
    and last_number  = p_pickup_number
    and last_number  > 0;
end;
$$ language plpgsql security definer;

grant execute on function get_next_pickup_number(text, text)          to anon, authenticated;
grant execute on function rollback_pickup_number(text, text, integer) to anon, authenticated;

-- ============================================================
-- 統一訂單表（orders + order_items）
-- 個人散單 + 揪團都寫入此表，供未來後台管理使用
-- ============================================================
create table if not exists orders (
  id                      text primary key,            -- nanoid(10)；揪團用 group_id
  order_type              text not null check (order_type in ('solo','group')),
  building_id             text not null default 'B01',
  session_date            date not null,
  pickup_number           integer,

  status                  text not null default 'pending'
                          check (status in ('pending','confirmed','cancelled')),
  payment_status          text not null default 'unpaid'
                          check (payment_status in ('unpaid','paid','refunded')),

  customer_name           text not null,
  customer_phone          text not null,
  customer_email          text,
  customer_notes          text,
  want_receipt            boolean not null default false,
  tax_id                  text,

  payment_method          text,
  delivery_person         text,
  promo_code              text,

  items_subtotal          integer not null default 0,
  delivery_fee            integer not null default 0,
  delivery_fee_by_consumer  boolean not null default false,
  payment_fee             integer not null default 0,
  payment_fee_by_consumer   boolean not null default false,
  net_amount              integer,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index if not exists orders_session_date_idx on orders (building_id, session_date);
create index if not exists orders_status_idx on orders (status, payment_status);

create table if not exists order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        text not null references orders(id) on delete cascade,
  line_number     integer not null,
  member_name     text,                                  -- 揪團成員；散單為 null
  item_type       text not null default 'product'
                  check (item_type in ('product','discount','refund')),
  display_name    text not null,
  food_name       text not null,
  spec            text,
  restaurant_name text,
  quantity        integer not null default 1 check (quantity > 0),
  unit_price      integer not null default 0,
  subtotal        integer not null default 0,
  product_url     text,
  created_at      timestamptz not null default now()
);
create index if not exists order_items_order_idx on order_items (order_id);

alter table orders enable row level security;
alter table order_items enable row level security;

drop policy if exists orders_read   on orders;
drop policy if exists orders_insert on orders;
drop policy if exists orders_update on orders;
create policy orders_read   on orders for select using (true);
create policy orders_insert on orders for insert with check (true);
create policy orders_update on orders for update using (true);

drop policy if exists order_items_read   on order_items;
drop policy if exists order_items_insert on order_items;
create policy order_items_read   on order_items for select using (true);
create policy order_items_insert on order_items for insert with check (true);

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at before update on orders
  for each row execute function update_updated_at();
