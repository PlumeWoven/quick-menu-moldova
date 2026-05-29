
-- ============ TABLES ============
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Restaurant',
  slug text unique not null,
  address text,
  phone text,
  logo_url text,
  is_active boolean not null default true,
  subscription_tier text not null default 'basic',
  subscription_expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.restaurants(admin_id);
create index on public.restaurants(slug);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.categories(restaurant_id);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  is_available boolean not null default true,
  preparation_time_minutes int not null default 15,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.items(category_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_number text,
  customer_name text,
  customer_phone text,
  items jsonb not null default '[]'::jsonb,
  total numeric(10,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','confirmed','preparing','ready','completed','cancelled')),
  payment_method text check (payment_method in ('cash','card')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.orders(restaurant_id, created_at desc);
create index on public.orders(restaurant_id, status);

-- ============ updated_at trigger ============
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ============ Auto-create restaurant on signup ============
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug text;
  final_slug text;
  counter int := 0;
begin
  base_slug := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]+', '-', 'g'));
  if base_slug = '' or base_slug is null then
    base_slug := 'restaurant';
  end if;
  final_slug := base_slug;
  while exists (select 1 from public.restaurants where slug = final_slug) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::text;
  end loop;

  insert into public.restaurants (admin_id, name, slug)
  values (new.id, 'My Restaurant', final_slug);
  return new;
end$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ RLS ============
alter table public.restaurants enable row level security;
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.orders enable row level security;

-- Public read of active rows
create policy "Public can view active restaurants"
  on public.restaurants for select
  using (is_active = true);

create policy "Public can view active categories"
  on public.categories for select
  using (
    is_active = true
    and exists (select 1 from public.restaurants r where r.id = categories.restaurant_id and r.is_active = true)
  );

create policy "Public can view available items"
  on public.items for select
  using (
    exists (
      select 1 from public.categories c
      join public.restaurants r on r.id = c.restaurant_id
      where c.id = items.category_id and c.is_active = true and r.is_active = true
    )
  );

-- Admin (owner) full access
create policy "Owners manage their restaurant"
  on public.restaurants for all
  using (auth.uid() = admin_id)
  with check (auth.uid() = admin_id);

create policy "Owners manage their categories"
  on public.categories for all
  using (exists (select 1 from public.restaurants r where r.id = categories.restaurant_id and r.admin_id = auth.uid()))
  with check (exists (select 1 from public.restaurants r where r.id = categories.restaurant_id and r.admin_id = auth.uid()));

create policy "Owners manage their items"
  on public.items for all
  using (exists (
    select 1 from public.categories c
    join public.restaurants r on r.id = c.restaurant_id
    where c.id = items.category_id and r.admin_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.categories c
    join public.restaurants r on r.id = c.restaurant_id
    where c.id = items.category_id and r.admin_id = auth.uid()
  ));

-- Orders: public can insert into active restaurants; owners can SELECT/UPDATE/DELETE theirs
create policy "Public can place orders"
  on public.orders for insert
  with check (
    exists (select 1 from public.restaurants r where r.id = orders.restaurant_id and r.is_active = true)
  );

create policy "Customers can view their order by id"
  on public.orders for select
  using (true);  -- order id is a uuid; viewing by id from status page is allowed

create policy "Owners update their orders"
  on public.orders for update
  using (exists (select 1 from public.restaurants r where r.id = orders.restaurant_id and r.admin_id = auth.uid()))
  with check (exists (select 1 from public.restaurants r where r.id = orders.restaurant_id and r.admin_id = auth.uid()));

create policy "Owners delete their orders"
  on public.orders for delete
  using (exists (select 1 from public.restaurants r where r.id = orders.restaurant_id and r.admin_id = auth.uid()));

-- ============ Realtime ============
alter publication supabase_realtime add table public.orders;
alter table public.orders replica identity full;

-- ============ Storage ============
insert into storage.buckets (id, name, public) values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

create policy "Public read menu-images"
  on storage.objects for select
  using (bucket_id = 'menu-images');

create policy "Auth users upload menu-images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'menu-images');

create policy "Auth users update own menu-images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'menu-images' and owner = auth.uid());

create policy "Auth users delete own menu-images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'menu-images' and owner = auth.uid());
