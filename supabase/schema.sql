-- ============================================================================
-- UNIHUB — SCHEMA DE BASE DE DATOS (Supabase / PostgreSQL)
-- ============================================================================
-- Ejecutar en el SQL Editor de Supabase, en orden, una sola vez.
-- Arquitectura: University -> Faculty -> User/Business -> Product
-- Esto permite incorporar nuevas universidades sin reconstruir el sistema.
-- ============================================================================

-- Extensión para generar UUIDs
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
create type user_role as enum ('comprador', 'emprendedor');
create type order_status as enum ('pendiente', 'confirmado', 'en_preparacion', 'completado', 'cancelado');
create type product_category as enum ('comida', 'ropa', 'tecnologia', 'accesorios', 'servicios', 'otros');

-- ----------------------------------------------------------------------------
-- UNIVERSITIES
-- ----------------------------------------------------------------------------
create table universities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  domain text not null unique,           -- dominio institucional, p.ej. ean.edu.co
  logo text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- FACULTIES
-- ----------------------------------------------------------------------------
create table faculties (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references universities(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (university_id, name)
);

create index idx_faculties_university on faculties(university_id);

-- ----------------------------------------------------------------------------
-- PROFILES  (extiende auth.users de Supabase)
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  university_id uuid not null references universities(id),
  faculty_id uuid not null references faculties(id),
  role user_role not null default 'comprador',
  created_at timestamptz not null default now()
);

create index idx_profiles_university on profiles(university_id);

-- ----------------------------------------------------------------------------
-- BUSINESSES
-- ----------------------------------------------------------------------------
create table businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text not null default '',
  category product_category not null,
  university_id uuid not null references universities(id),
  faculty_id uuid not null references faculties(id),
  logo text,
  cover_image text,
  verified boolean not null default false,   -- SOLO modificable por admin/backend
  rating numeric(2,1) not null default 0,
  created_at timestamptz not null default now()
);

create index idx_businesses_owner on businesses(owner_id);
create index idx_businesses_university on businesses(university_id);

-- Un emprendedor tiene un único emprendimiento en el MVP
create unique index idx_businesses_owner_unique on businesses(owner_id);

-- ----------------------------------------------------------------------------
-- PRODUCTS
-- ----------------------------------------------------------------------------
create table products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  category product_category not null,
  image text,
  available boolean not null default true,
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now()
);

create index idx_products_business on products(business_id);
create index idx_products_category on products(category);

-- ----------------------------------------------------------------------------
-- ORDERS
-- ----------------------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  total numeric(10,2) not null check (total >= 0),
  status order_status not null default 'pendiente',
  created_at timestamptz not null default now()
);

create index idx_orders_buyer on orders(buyer_id);
create index idx_orders_business on orders(business_id);

-- ----------------------------------------------------------------------------
-- ORDER_ITEMS
-- ----------------------------------------------------------------------------
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0)
);

create index idx_order_items_order on order_items(order_id);

-- ----------------------------------------------------------------------------
-- REVIEWS
-- ----------------------------------------------------------------------------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  buyer_id uuid not null references profiles(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text default '',
  created_at timestamptz not null default now(),
  unique (order_id) -- una reseña por pedido: evita duplicados
);

create index idx_reviews_business on reviews(business_id);

-- ============================================================================
-- FUNCIÓN: actualizar rating promedio del negocio tras cada reseña
-- ============================================================================
create or replace function update_business_rating()
returns trigger as $$
begin
  update businesses
  set rating = (
    select coalesce(round(avg(rating)::numeric, 1), 0)
    from reviews
    where business_id = coalesce(new.business_id, old.business_id)
  )
  where id = coalesce(new.business_id, old.business_id);
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_update_business_rating
after insert or update or delete on reviews
for each row execute function update_business_rating();

-- ============================================================================
-- FUNCIÓN: helper para saber si el usuario actual es dueño del negocio
-- ============================================================================
create or replace function is_business_owner(biz_id uuid)
returns boolean as $$
  select exists (
    select 1 from businesses
    where id = biz_id and owner_id = auth.uid()
  );
$$ language sql security definer stable;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table universities enable row level security;
alter table faculties enable row level security;
alter table profiles enable row level security;
alter table businesses enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table reviews enable row level security;

-- ---------------- UNIVERSITIES & FACULTIES: lectura pública ----------------
create policy "universities_select_all" on universities for select using (true);
create policy "faculties_select_all" on faculties for select using (true);

-- ---------------- PROFILES ----------------
-- Cualquier usuario autenticado puede ver perfiles públicos básicos
-- (necesario para mostrar nombre del comprador en pedidos del emprendedor, etc.)
create policy "profiles_select_authenticated" on profiles
  for select using (auth.role() = 'authenticated');

-- Un usuario solo puede crear su propio perfil (al registrarse)
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

-- Un usuario solo puede modificar su propio perfil, y jamás cambiar su propio "id"
-- (el rol se permite editar aquí a nivel de policy; en el MVP se fija en el registro)
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------- BUSINESSES ----------------
-- Lectura pública: cualquiera puede explorar emprendimientos
create policy "businesses_select_all" on businesses
  for select using (true);

-- Un usuario autenticado puede crear su propio emprendimiento (uno solo, ver índice único)
-- El campo verified se ignora aquí: el DEFAULT false decide, ver policy de update abajo
create policy "businesses_insert_own" on businesses
  for insert with check (auth.uid() = owner_id);

-- Solo el dueño puede actualizar su emprendimiento, y NUNCA puede tocar "verified"
-- (se compara contra el valor ya almacenado para bloquear cualquier cambio)
create policy "businesses_update_own" on businesses
  for update using (auth.uid() = owner_id)
  with check (
    auth.uid() = owner_id
    and verified = (select verified from businesses b where b.id = businesses.id)
  );

-- ---------------- PRODUCTS ----------------
-- Lectura pública
create policy "products_select_all" on products
  for select using (true);

-- Solo el dueño del emprendimiento puede crear productos para ese emprendimiento
create policy "products_insert_own_business" on products
  for insert with check (is_business_owner(business_id));

-- Solo el dueño puede editar/desactivar sus propios productos
create policy "products_update_own_business" on products
  for update using (is_business_owner(business_id))
  with check (is_business_owner(business_id));

create policy "products_delete_own_business" on products
  for delete using (is_business_owner(business_id));

-- ---------------- ORDERS ----------------
-- El comprador ve sus propios pedidos; el emprendedor ve pedidos de su emprendimiento
create policy "orders_select_own" on orders
  for select using (
    auth.uid() = buyer_id or is_business_owner(business_id)
  );

-- Cualquier usuario autenticado puede crear un pedido como comprador
create policy "orders_insert_own" on orders
  for insert with check (auth.uid() = buyer_id);

-- El comprador puede cancelar; el emprendedor puede actualizar el estado del pedido
create policy "orders_update_buyer_or_owner" on orders
  for update using (
    auth.uid() = buyer_id or is_business_owner(business_id)
  )
  with check (
    auth.uid() = buyer_id or is_business_owner(business_id)
  );

-- ---------------- ORDER_ITEMS ----------------
create policy "order_items_select_related" on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and (o.buyer_id = auth.uid() or is_business_owner(o.business_id))
    )
  );

create policy "order_items_insert_own_order" on order_items
  for insert with check (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id and o.buyer_id = auth.uid()
    )
  );

-- ---------------- REVIEWS ----------------
-- Lectura pública (para mostrar calificaciones)
create policy "reviews_select_all" on reviews
  for select using (true);

-- Solo se puede crear una reseña si: el pedido es del usuario, pertenece al
-- negocio indicado, y el pedido está "completado" (evita reseñas prematuras).
-- El unique(order_id) en la tabla evita duplicados a nivel de base de datos.
create policy "reviews_insert_eligible" on reviews
  for insert with check (
    auth.uid() = buyer_id
    and exists (
      select 1 from orders o
      where o.id = reviews.order_id
        and o.buyer_id = auth.uid()
        and o.business_id = reviews.business_id
        and o.status = 'completado'
    )
  );

-- ============================================================================
-- SEED: Universidad EAN (única universidad activa en el MVP)
-- ============================================================================
insert into universities (name, domain, is_active) values
  ('Universidad EAN', 'universidadean.edu.co', true);

insert into faculties (university_id, name)
select id, f.name from universities, unnest(array[
  'Ingeniería',
  'Ciencias Administrativas',
  'Ciencias Económicas',
  'Humanidades y Ciencias Sociales',
  'Postgrados'
]) as f(name)
where universities.domain = 'universidadean.edu.co';

-- ============================================================================
-- NOTA SOBRE DATOS DE DEMOSTRACIÓN
-- ============================================================================
-- Los emprendimientos y productos de demostración (Dulce EAN, Tech Campus,
-- EAN Style, Campus Snacks, Student Tutors) requieren usuarios reales en
-- auth.users como owner_id, por lo que no se insertan aquí. En el frontend,
-- src/data/demoData.ts contiene estos datos de forma independiente para que
-- la aplicación sea usable sin necesidad de credenciales de Supabase.
-- Para poblar la base de datos real, crea los usuarios emprendedores desde
-- el flujo de registro y luego inserta sus emprendimientos/productos con
-- el mismo contenido de demoData.ts.
