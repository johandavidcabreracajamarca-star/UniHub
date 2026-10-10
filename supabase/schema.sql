-- ============================================================================
-- UNIHUB — ESQUEMA COMPLETO DE LA BASE DE DATOS (Supabase / PostgreSQL)
-- ============================================================================
-- Exportado de la base de datos de producción el 9 de octubre de 2026 con
-- supabase/exportar_esquema.sql. Para recrear la base desde cero: proyecto
-- nuevo de Supabase → SQL Editor → pegar este archivo → Run.
--
-- Al cambiar algo en la base de datos, vuelve a exportarlo con esa consulta
-- para que este archivo no se desactualice. Los cambios puntuales quedan
-- documentados en supabase/migrations/.
--
-- No incluye (a propósito):
--   • Los webhooks de avisos push_pedidos y push_mensajes: su definición
--     lleva la clave secreta. Se crean siguiendo
--     supabase/functions/send-push/README.md.
--   • Los secretos de la función send-push (están en supabase/.env.push,
--     fuera de GitHub).
-- ============================================================================

-- ============================================================================
-- 1. TIPOS (enums)
-- ============================================================================
create type public.order_status as enum ('pendiente', 'confirmado', 'en_preparacion', 'completado', 'cancelado');
create type public.product_category as enum ('comida', 'ropa', 'tecnologia', 'accesorios', 'servicios', 'otros');
create type public.user_role as enum ('comprador', 'emprendedor', 'admin');

-- ============================================================================
-- 2. TABLAS
-- ============================================================================
create table public.businesses (
  id uuid default gen_random_uuid() not null,
  owner_id uuid not null,
  name text not null,
  description text default ''::text not null,
  category product_category not null,
  university_id uuid not null,
  faculty_id uuid not null,
  logo text,
  cover_image text,
  verified boolean default false not null,
  rating numeric(2,1) default 0 not null,
  created_at timestamp with time zone default now() not null,
  suspended boolean default false not null,
  latitude double precision,
  longitude double precision,
  available_now boolean default false not null,
  availability_note text,
  constraint businesses_pkey PRIMARY KEY (id)
);

create table public.conversations (
  id uuid default gen_random_uuid() not null,
  business_id uuid not null,
  buyer_id uuid not null,
  created_at timestamp with time zone default now() not null,
  last_message_at timestamp with time zone default now() not null,
  constraint conversations_business_id_buyer_id_key UNIQUE (business_id, buyer_id),
  constraint conversations_pkey PRIMARY KEY (id)
);

create table public.faculties (
  id uuid default gen_random_uuid() not null,
  university_id uuid not null,
  name text not null,
  created_at timestamp with time zone default now() not null,
  constraint faculties_university_id_name_key UNIQUE (university_id, name),
  constraint faculties_pkey PRIMARY KEY (id)
);

create table public.favorites (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  business_id uuid not null,
  created_at timestamp with time zone default now() not null,
  constraint favorites_user_id_business_id_key UNIQUE (user_id, business_id),
  constraint favorites_pkey PRIMARY KEY (id)
);

create table public.messages (
  id uuid default gen_random_uuid() not null,
  conversation_id uuid not null,
  sender_id uuid not null,
  content text not null,
  created_at timestamp with time zone default now() not null,
  read boolean default false not null,
  constraint messages_pkey PRIMARY KEY (id)
);

create table public.notifications (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  order_id uuid not null,
  message text not null,
  read boolean default false not null,
  created_at timestamp with time zone default now() not null,
  link text,
  constraint notifications_pkey PRIMARY KEY (id)
);

create table public.order_items (
  id uuid default gen_random_uuid() not null,
  order_id uuid not null,
  product_id uuid,
  quantity integer not null,
  unit_price numeric(10,2) not null,
  variant_id uuid,
  variant_name text,
  constraint order_items_pkey PRIMARY KEY (id),
  constraint order_items_quantity_check CHECK ((quantity > 0)),
  constraint order_items_unit_price_check CHECK ((unit_price >= (0)::numeric))
);

create table public.orders (
  id uuid default gen_random_uuid() not null,
  buyer_id uuid not null,
  business_id uuid not null,
  total numeric(10,2) not null,
  status order_status default 'pendiente'::order_status not null,
  created_at timestamp with time zone default now() not null,
  cancellation_reason text,
  constraint orders_pkey PRIMARY KEY (id),
  constraint orders_total_check CHECK ((total >= (0)::numeric))
);

create table public.product_variants (
  id uuid default gen_random_uuid() not null,
  product_id uuid not null,
  name text not null,
  price numeric(10,2) not null,
  stock integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  constraint product_variants_pkey PRIMARY KEY (id),
  constraint product_variants_price_check CHECK ((price >= (0)::numeric)),
  constraint product_variants_stock_check CHECK ((stock >= 0))
);

create table public.product_views (
  id bigint generated always as identity not null,
  product_id uuid not null,
  business_id uuid not null,
  viewer_id uuid default auth.uid() not null,
  view_date date default ((now() AT TIME ZONE 'America/Bogota'::text))::date not null,
  created_at timestamp with time zone default now() not null,
  constraint product_views_product_id_viewer_id_view_date_key UNIQUE (product_id, viewer_id, view_date),
  constraint product_views_pkey PRIMARY KEY (id)
);

create table public.products (
  id uuid default gen_random_uuid() not null,
  business_id uuid not null,
  name text not null,
  description text default ''::text not null,
  price numeric(10,2) not null,
  category product_category not null,
  image text,
  available boolean default true not null,
  stock integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  suspended boolean default false not null,
  discount_percent integer,
  discount_starts_at timestamp with time zone,
  discount_ends_at timestamp with time zone,
  constraint products_pkey PRIMARY KEY (id),
  constraint products_price_check CHECK ((price >= (0)::numeric)),
  constraint products_stock_check CHECK ((stock >= 0))
);

create table public.profiles (
  id uuid not null,
  full_name text not null,
  email text not null,
  university_id uuid not null,
  faculty_id uuid not null,
  role user_role default 'comprador'::user_role not null,
  created_at timestamp with time zone default now() not null,
  constraint profiles_email_key UNIQUE (email),
  constraint profiles_pkey PRIMARY KEY (id)
);

create table public.push_subscriptions (
  id bigint generated always as identity not null,
  user_id uuid default auth.uid() not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default now() not null,
  constraint push_subscriptions_endpoint_key UNIQUE (endpoint),
  constraint push_subscriptions_pkey PRIMARY KEY (id)
);

create table public.reviews (
  id uuid default gen_random_uuid() not null,
  order_id uuid not null,
  buyer_id uuid not null,
  business_id uuid not null,
  rating smallint not null,
  comment text default ''::text,
  created_at timestamp with time zone default now() not null,
  constraint reviews_order_id_key UNIQUE (order_id),
  constraint reviews_pkey PRIMARY KEY (id),
  constraint reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);

create table public.universities (
  id uuid default gen_random_uuid() not null,
  name text not null,
  domain text not null,
  logo text,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  constraint universities_domain_key UNIQUE (domain),
  constraint universities_name_key UNIQUE (name),
  constraint universities_pkey PRIMARY KEY (id)
);


-- ============================================================================
-- 3. LLAVES FORÁNEAS
-- ============================================================================
alter table public.businesses add constraint businesses_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES faculties(id);
alter table public.businesses add constraint businesses_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.businesses add constraint businesses_university_id_fkey FOREIGN KEY (university_id) REFERENCES universities(id);
alter table public.conversations add constraint conversations_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public.conversations add constraint conversations_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.faculties add constraint faculties_university_id_fkey FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE;
alter table public.favorites add constraint favorites_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public.favorites add constraint favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.messages add constraint messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
alter table public.messages add constraint messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.notifications add constraint notifications_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
alter table public.notifications add constraint notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.order_items add constraint order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
alter table public.order_items add constraint order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id);
alter table public.order_items add constraint order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;
alter table public.orders add constraint orders_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public.orders add constraint orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.product_variants add constraint product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
alter table public.product_views add constraint product_views_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public.product_views add constraint product_views_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
alter table public.product_views add constraint product_views_viewer_id_fkey FOREIGN KEY (viewer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.products add constraint products_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public.profiles add constraint profiles_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES faculties(id);
alter table public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.profiles add constraint profiles_university_id_fkey FOREIGN KEY (university_id) REFERENCES universities(id);
alter table public.push_subscriptions add constraint push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.reviews add constraint reviews_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public.reviews add constraint reviews_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.reviews add constraint reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- ============================================================================
-- 4. ÍNDICES
-- ============================================================================
CREATE INDEX idx_businesses_owner ON public.businesses USING btree (owner_id);
CREATE UNIQUE INDEX idx_businesses_owner_unique ON public.businesses USING btree (owner_id);
CREATE INDEX idx_businesses_university ON public.businesses USING btree (university_id);
CREATE INDEX idx_conversations_business ON public.conversations USING btree (business_id);
CREATE INDEX idx_conversations_buyer ON public.conversations USING btree (buyer_id);
CREATE INDEX idx_faculties_university ON public.faculties USING btree (university_id);
CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id);
CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);
CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);
CREATE INDEX idx_orders_business ON public.orders USING btree (business_id);
CREATE INDEX idx_orders_buyer ON public.orders USING btree (buyer_id);
CREATE INDEX idx_product_variants_product ON public.product_variants USING btree (product_id);
CREATE INDEX idx_products_business ON public.products USING btree (business_id);
CREATE INDEX idx_products_category ON public.products USING btree (category);
CREATE INDEX idx_profiles_university ON public.profiles USING btree (university_id);
CREATE INDEX idx_reviews_business ON public.reviews USING btree (business_id);
CREATE INDEX product_views_business_date_idx ON public.product_views USING btree (business_id, view_date);
CREATE INDEX push_subscriptions_user_idx ON public.push_subscriptions USING btree (user_id);

-- ============================================================================
-- 6. FUNCIONES
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_force_delete_product(p_product_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  if not is_admin() then
    raise exception 'Solo un administrador puede forzar el borrado de un producto.';
  end if;

  update order_items set product_id = null where product_id = p_product_id;
  delete from products where id = p_product_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.business_favorites_count(biz_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when public.is_business_owner(biz_id) or public.is_admin()
      then (select count(*)::int from public.favorites f where f.business_id = biz_id)
    else null
  end;
$function$
;

CREATE OR REPLACE FUNCTION public.decrement_stock_on_order_item()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  if new.variant_id is not null then
    update product_variants
    set stock = greatest(stock - new.quantity, 0)
    where id = new.variant_id;
  else
    update products
    set stock = greatest(stock - new.quantity, 0)
    where id = new.product_id;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.guard_business_admin_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.verified is distinct from old.verified or new.suspended is distinct from old.suspended then
      raise exception 'Solo un administrador puede verificar o suspender un emprendimiento.';
    end if;
    if new.owner_id is distinct from old.owner_id then
      raise exception 'No puedes cambiar el dueño del emprendimiento.';
    end if;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.guard_order_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is not null then
    new.status := 'pendiente';
    new.cancellation_reason := null;
    if public.is_business_owner(new.business_id) then
      raise exception 'No puedes comprarle a tu propio emprendimiento.';
    end if;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.guard_order_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.buyer_id is distinct from old.buyer_id
       or new.business_id is distinct from old.business_id then
      raise exception 'No se puede cambiar el comprador ni el emprendimiento de un pedido.';
    end if;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.guard_product_admin_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.suspended is distinct from old.suspended then
      raise exception 'Solo un administrador puede suspender o reactivar un producto.';
    end if;
    if new.business_id is distinct from old.business_id then
      raise exception 'No puedes mover el producto a otro emprendimiento.';
    end if;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.guard_profile_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'INSERT' then
    -- Nadie nace admin: el rol llega desde el formulario de registro y se
    -- podría manipular. Para nombrar un admin, cambia su rol después desde
    -- el panel de Supabase (Table Editor → profiles).
    if new.role = 'admin' then
      new.role := 'comprador';
    end if;
    return new;
  end if;

  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'No puedes cambiar tu rol.';
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.guard_review_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is not null and public.is_business_owner(new.business_id) then
    raise exception 'No puedes reseñar tu propio emprendimiento.';
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, full_name, email, university_id, faculty_id, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    (new.raw_user_meta_data->>'university_id')::uuid,
    (new.raw_user_meta_data->>'faculty_id')::uuid,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'comprador')
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_business_owner(biz_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select exists (
    select 1 from businesses
    where id = biz_id and owner_id = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.notify_seller_new_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_owner uuid;
  v_buyer uuid;
  v_total numeric;
  v_amount numeric;
  v_product text;
  v_buyer_name text;
begin
  select b.owner_id, o.buyer_id, o.total
    into v_owner, v_buyer, v_total
  from public.orders o
  join public.businesses b on b.id = o.business_id
  where o.id = new.order_id;

  if v_owner is null or v_owner = v_buyer then
    return new;
  end if;

  -- Valor de esta compra: cantidad × precio; si no está, el total del pedido
  v_amount := nullif(new.quantity * new.unit_price, 0);
  if v_amount is null then
    v_amount := nullif(v_total, 0);
  end if;

  select p.name into v_product from public.products p where p.id = new.product_id;
  select split_part(pr.full_name, ' ', 1) into v_buyer_name from public.profiles pr where pr.id = v_buyer;

  -- "Camila te pidió 2 × Caja de 6 cupcakes · $24.000"
  insert into public.notifications (user_id, order_id, message, read, link)
  values (
    v_owner,
    new.order_id,
    coalesce(nullif(v_buyer_name, ''), 'Un estudiante') || U&' te pidi\00F3 '
      || new.quantity || U&' \00D7 ' || coalesce(v_product, 'un producto')
      || coalesce(' (' || nullif(new.variant_name, '') || ')', '')
      || coalesce(U&' \00B7 $' || replace(to_char(v_amount, 'FM999,999,999'), ',', '.'), ''),
    false,
    '/dashboard/orders'
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.order_items_set_price()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_order   record;
  v_product record;
  v_variant record;
  v_price   numeric;
begin
  select * into v_order from orders where id = new.order_id;
  if not found then
    raise exception 'Pedido no encontrado.';
  end if;
  if v_order.status <> 'pendiente' then
    raise exception 'Solo se pueden agregar productos a un pedido pendiente.';
  end if;
  if new.quantity is null or new.quantity <= 0 then
    raise exception 'La cantidad debe ser mayor a cero.';
  end if;

  select * into v_product from products where id = new.product_id;
  if not found or v_product.business_id <> v_order.business_id then
    raise exception 'El producto no pertenece a este emprendimiento.';
  end if;
  if not v_product.available or coalesce(v_product.suspended, false) then
    raise exception 'El producto ya no está disponible.';
  end if;

  if new.variant_id is not null then
    select * into v_variant
      from product_variants
     where id = new.variant_id and product_id = new.product_id;
    if not found then
      raise exception 'Esa opción del producto no existe.';
    end if;
    if v_variant.stock < new.quantity then
      raise exception 'No hay suficiente stock disponible para esa opción.';
    end if;
    v_price := v_variant.price;
    new.variant_name := v_variant.name;
  else
    if exists (select 1 from product_variants where product_id = new.product_id) then
      raise exception 'Elige una opción del producto.';
    end if;
    if v_product.stock < new.quantity then
      raise exception 'No hay suficiente stock disponible.';
    end if;
    v_price := v_product.price;
    if coalesce(v_product.discount_percent, 0) > 0
       and v_product.discount_starts_at is not null
       and v_product.discount_ends_at is not null
       and now() between v_product.discount_starts_at and v_product.discount_ends_at then
      v_price := round(v_product.price * (1 - v_product.discount_percent / 100.0));
    end if;
  end if;

  new.unit_price := v_price;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.order_items_update_total()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update orders
     set total = (
       select coalesce(sum(quantity * unit_price), 0)
         from order_items
        where order_id = new.order_id
     )
   where id = new.order_id;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.orders_before_insert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if current_user = 'authenticated' then
    new.status := 'pendiente';
    new.total := 0;
    new.cancellation_reason := null;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.orders_protect_fields()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if current_user = 'authenticated' then
    new.buyer_id := old.buyer_id;
    new.business_id := old.business_id;
    new.total := old.total;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.protect_business_admin_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  if not is_admin() then
    new.verified := old.verified;
    new.suspended := old.suspended;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.protect_product_admin_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  if not is_admin() then
    new.suspended := old.suspended;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.protect_profile_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null then
    raise exception 'Inicia sesi√≥n para activar los avisos.';
  end if;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update
    set user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        created_at = now();
end;
$function$
;

CREATE OR REPLACE FUNCTION public.touch_conversation_last_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  update conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_business_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;


-- ============================================================================
-- 7. TRIGGERS (incluye on_auth_user_created sobre auth.users)
-- ============================================================================
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER trg_guard_business_admin_fields BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION guard_business_admin_fields();

CREATE TRIGGER trg_protect_business_admin_fields BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION protect_business_admin_fields();

CREATE TRIGGER trg_touch_conversation_last_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION touch_conversation_last_message();

CREATE TRIGGER trg_decrement_stock_on_order_item AFTER INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_order_item();

CREATE TRIGGER trg_notify_seller_new_order AFTER INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION notify_seller_new_order();

CREATE TRIGGER trg_order_items_set_price BEFORE INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION order_items_set_price();

CREATE TRIGGER trg_order_items_update_total AFTER INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION order_items_update_total();

CREATE TRIGGER trg_guard_order_insert BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION guard_order_insert();

CREATE TRIGGER trg_guard_order_update BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION guard_order_update();

CREATE TRIGGER trg_orders_before_insert BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION orders_before_insert();

CREATE TRIGGER trg_orders_protect_fields BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION orders_protect_fields();

CREATE TRIGGER trg_guard_product_admin_fields BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION guard_product_admin_fields();

CREATE TRIGGER trg_protect_product_admin_fields BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION protect_product_admin_fields();

CREATE TRIGGER protect_profile_role_trg BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION protect_profile_role();

CREATE TRIGGER trg_guard_profile_role BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION guard_profile_role();

CREATE TRIGGER trg_guard_review_insert BEFORE INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION guard_review_insert();

CREATE TRIGGER trg_update_business_rating AFTER INSERT OR DELETE OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_business_rating();


-- ============================================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================================
alter table public.businesses enable row level security;
alter table public.conversations enable row level security;
alter table public.faculties enable row level security;
alter table public.favorites enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.order_items enable row level security;
alter table public.orders enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_views enable row level security;
alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.reviews enable row level security;
alter table public.universities enable row level security;

-- ============================================================================
-- 9. REGLAS DE ACCESO (políticas RLS, incluye Storage)
-- ============================================================================
create policy businesses_insert_own on public.businesses as permissive for insert to public with check ((auth.uid() = owner_id));
create policy businesses_select_visible on public.businesses as permissive for select to public using (((NOT suspended) OR (auth.uid() = owner_id) OR is_admin()));
create policy businesses_update_admin on public.businesses as permissive for update to public using (is_admin()) with check (is_admin());
create policy businesses_update_own on public.businesses as permissive for update to public using ((auth.uid() = owner_id)) with check ((auth.uid() = owner_id));
create policy conversations_insert_buyer on public.conversations as permissive for insert to public with check ((auth.uid() = buyer_id));
create policy conversations_select_participants on public.conversations as permissive for select to public using (((auth.uid() = buyer_id) OR is_business_owner(business_id)));
create policy faculties_select_all on public.faculties as permissive for select to public using (true);
create policy favorites_delete_own on public.favorites as permissive for delete to public using ((auth.uid() = user_id));
create policy favorites_insert_own on public.favorites as permissive for insert to public with check ((auth.uid() = user_id));
create policy favorites_select_own on public.favorites as permissive for select to public using ((auth.uid() = user_id));
create policy messages_insert_participants on public.messages as permissive for insert to public with check (((sender_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.buyer_id = auth.uid()) OR is_business_owner(c.business_id)))))));
create policy messages_select_participants on public.messages as permissive for select to public using ((EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.buyer_id = auth.uid()) OR is_business_owner(c.business_id))))));
create policy messages_update_mark_read on public.messages as permissive for update to public using (((sender_id <> auth.uid()) AND (EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.buyer_id = auth.uid()) OR is_business_owner(c.business_id))))))) with check (((sender_id <> auth.uid()) AND (EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.buyer_id = auth.uid()) OR is_business_owner(c.business_id)))))));
create policy notifications_insert_related_order on public.notifications as permissive for insert to public with check ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = notifications.order_id) AND (o.buyer_id = notifications.user_id) AND ((auth.uid() = o.buyer_id) OR is_business_owner(o.business_id))))));
create policy notifications_select_own on public.notifications as permissive for select to public using ((auth.uid() = user_id));
create policy notifications_update_own on public.notifications as permissive for update to public using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
create policy order_items_insert_own_order on public.order_items as permissive for insert to public with check ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = order_items.order_id) AND (o.buyer_id = auth.uid())))));
create policy order_items_select_related on public.order_items as permissive for select to public using ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = order_items.order_id) AND ((o.buyer_id = auth.uid()) OR is_business_owner(o.business_id))))));
create policy orders_insert_own on public.orders as permissive for insert to public with check ((auth.uid() = buyer_id));
create policy orders_select_own on public.orders as permissive for select to public using (((auth.uid() = buyer_id) OR is_business_owner(business_id)));
create policy orders_update_owner on public.orders as permissive for update to public using (is_business_owner(business_id)) with check (is_business_owner(business_id));
create policy product_variants_delete_own_business on public.product_variants as permissive for delete to public using ((EXISTS ( SELECT 1
   FROM products p
  WHERE ((p.id = product_variants.product_id) AND is_business_owner(p.business_id)))));
create policy product_variants_insert_own_business on public.product_variants as permissive for insert to public with check ((EXISTS ( SELECT 1
   FROM products p
  WHERE ((p.id = product_variants.product_id) AND is_business_owner(p.business_id)))));
create policy product_variants_select_all on public.product_variants as permissive for select to public using (true);
create policy product_variants_update_own_business on public.product_variants as permissive for update to public using ((EXISTS ( SELECT 1
   FROM products p
  WHERE ((p.id = product_variants.product_id) AND is_business_owner(p.business_id))))) with check ((EXISTS ( SELECT 1
   FROM products p
  WHERE ((p.id = product_variants.product_id) AND is_business_owner(p.business_id)))));
create policy product_views_insert_own on public.product_views as permissive for insert to public with check (((viewer_id = auth.uid()) AND (NOT is_business_owner(business_id)) AND (EXISTS ( SELECT 1
   FROM products p
  WHERE ((p.id = product_views.product_id) AND (p.business_id = product_views.business_id))))));
create policy product_views_select_owner on public.product_views as permissive for select to public using ((is_business_owner(business_id) OR is_admin()));
create policy products_delete_admin on public.products as permissive for delete to public using (is_admin());
create policy products_delete_own_business on public.products as permissive for delete to public using (is_business_owner(business_id));
create policy products_insert_own_business on public.products as permissive for insert to public with check (is_business_owner(business_id));
create policy products_select_visible on public.products as permissive for select to public using ((((NOT suspended) AND (NOT (EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = products.business_id) AND b.suspended))))) OR is_business_owner(business_id) OR is_admin()));
create policy products_update_admin on public.products as permissive for update to public using (is_admin()) with check (is_admin());
create policy products_update_own_business on public.products as permissive for update to public using (is_business_owner(business_id)) with check (is_business_owner(business_id));
create policy profiles_insert_own on public.profiles as permissive for insert to public with check (((auth.uid() = id) AND (role <> 'admin'::user_role)));
create policy profiles_select_authenticated on public.profiles as permissive for select to public using ((auth.role() = 'authenticated'::text));
create policy profiles_update_own on public.profiles as permissive for update to public using ((auth.uid() = id)) with check ((auth.uid() = id));
create policy push_subscriptions_delete_own on public.push_subscriptions as permissive for delete to public using ((auth.uid() = user_id));
create policy push_subscriptions_insert_own on public.push_subscriptions as permissive for insert to public with check ((auth.uid() = user_id));
create policy push_subscriptions_select_own on public.push_subscriptions as permissive for select to public using ((auth.uid() = user_id));
create policy push_subscriptions_update_own on public.push_subscriptions as permissive for update to public using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
create policy reviews_insert_eligible on public.reviews as permissive for insert to public with check (((auth.uid() = buyer_id) AND (EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = reviews.order_id) AND (o.buyer_id = auth.uid()) AND (o.business_id = reviews.business_id) AND (o.status = 'completado'::order_status))))));
create policy reviews_select_all on public.reviews as permissive for select to public using (true);
create policy universities_select_all on public.universities as permissive for select to public using (true);
create policy business_images_delete_own on storage.objects as permissive for delete to public using (((bucket_id = 'business-images'::text) AND (owner = auth.uid())));
create policy business_images_insert_own_folder on storage.objects as permissive for insert to public with check (((bucket_id = 'business-images'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy business_images_select_all on storage.objects as permissive for select to public using ((bucket_id = 'business-images'::text));
create policy business_images_update_own on storage.objects as permissive for update to public using (((bucket_id = 'business-images'::text) AND (owner = auth.uid()))) with check (((bucket_id = 'business-images'::text) AND (owner = auth.uid())));
create policy product_images_delete_own on storage.objects as permissive for delete to public using (((bucket_id = 'product-images'::text) AND (owner = auth.uid())));
create policy product_images_insert_own_folder on storage.objects as permissive for insert to public with check (((bucket_id = 'product-images'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy product_images_select_all on storage.objects as permissive for select to public using ((bucket_id = 'product-images'::text));
create policy product_images_update_own on storage.objects as permissive for update to public using (((bucket_id = 'product-images'::text) AND (owner = auth.uid()))) with check (((bucket_id = 'product-images'::text) AND (owner = auth.uid())));

-- ============================================================================
-- 10. PERMISOS DE LA API
-- ============================================================================
grant references, select, trigger, truncate on public.businesses to anon;
grant delete, insert, references, select, trigger, truncate, update on public.businesses to authenticated;
grant references, select, trigger, truncate on public.businesses to service_role;
grant references, trigger, truncate on public.conversations to anon;
grant insert, references, select, trigger, truncate, update on public.conversations to authenticated;
grant references, select, trigger, truncate on public.conversations to service_role;
grant references, select, trigger, truncate on public.faculties to anon;
grant delete, insert, references, select, trigger, truncate, update on public.faculties to authenticated;
grant references, trigger, truncate on public.faculties to service_role;
grant references, trigger, truncate on public.favorites to anon;
grant delete, insert, references, select, trigger, truncate on public.favorites to authenticated;
grant references, trigger, truncate on public.favorites to service_role;
grant references, trigger, truncate on public.messages to anon;
grant insert, references, select, trigger, truncate, update on public.messages to authenticated;
grant references, trigger, truncate on public.messages to service_role;
grant references, trigger, truncate on public.notifications to anon;
grant insert, references, select, trigger, truncate, update on public.notifications to authenticated;
grant references, select, trigger, truncate on public.notifications to service_role;
grant references, select, trigger, truncate on public.order_items to anon;
grant delete, insert, references, select, trigger, truncate, update on public.order_items to authenticated;
grant references, trigger, truncate on public.order_items to service_role;
grant references, select, trigger, truncate on public.orders to anon;
grant delete, insert, references, select, trigger, truncate, update on public.orders to authenticated;
grant references, select, trigger, truncate on public.orders to service_role;
grant delete, insert, references, select, trigger, truncate, update on public.product_variants to anon;
grant delete, insert, references, select, trigger, truncate, update on public.product_variants to authenticated;
grant references, trigger, truncate on public.product_variants to service_role;
grant references, trigger, truncate on public.product_views to anon;
grant insert, references, select, trigger, truncate on public.product_views to authenticated;
grant delete, insert, references, select, trigger, truncate, update on public.product_views to service_role;
grant references, select, trigger, truncate on public.products to anon;
grant delete, insert, references, select, trigger, truncate, update on public.products to authenticated;
grant references, trigger, truncate on public.products to service_role;
grant references, trigger, truncate on public.profiles to anon;
grant delete, insert, references, trigger, truncate, update on public.profiles to authenticated;
grant references, select, trigger, truncate on public.profiles to service_role;
grant references, trigger, truncate on public.push_subscriptions to anon;
grant delete, insert, references, select, trigger, truncate, update on public.push_subscriptions to authenticated;
grant delete, insert, references, select, trigger, truncate, update on public.push_subscriptions to service_role;
grant references, select, trigger, truncate on public.reviews to anon;
grant delete, insert, references, select, trigger, truncate, update on public.reviews to authenticated;
grant references, trigger, truncate on public.reviews to service_role;
grant references, select, trigger, truncate on public.universities to anon;
grant delete, insert, references, select, trigger, truncate, update on public.universities to authenticated;
grant references, trigger, truncate on public.universities to service_role;

-- ============================================================================
-- 11. WEBHOOKS DE AVISOS (se crean desde el panel)
-- ============================================================================
-- Webhook push_mensajes en public.messages: se crea desde Integrations > Database Webhooks (ver supabase/functions/send-push/README.md)
-- Webhook push_pedidos en public.notifications: se crea desde Integrations > Database Webhooks (ver supabase/functions/send-push/README.md)

-- ============================================================================
-- 12. CARPETAS DE STORAGE
-- ============================================================================
insert into storage.buckets (id, name, public) values ('business-images', 'business-images', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict (id) do nothing;

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
