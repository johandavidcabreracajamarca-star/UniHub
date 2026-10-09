-- ============================================================================
-- UNIHUB — REFUERZO DE SEGURIDAD (9 oct 2026)
-- ============================================================================
-- Cómo aplicarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Se puede correr más de una vez sin problema (reemplaza lo anterior).
--
-- Usa triggers (reglas que corren dentro de la base de datos antes de guardar
-- un cambio), así funcionan aunque alguien llame a la API directamente sin
-- pasar por la app. Los cambios hechos desde el panel de Supabase (sin
-- usuario conectado, auth.uid() es NULL) siguen permitidos, para que puedas
-- administrar todo desde ahí.
-- ============================================================================


-- 1. NADIE PUEDE HACERSE ADMIN A SÍ MISMO --------------------------------
-- Antes: la regla profiles_update_own solo revisaba que el perfil fuera
-- propio, así que cualquier estudiante podía cambiar su "role" a 'admin'
-- y verificar/suspender negocios o borrar productos ajenos.
-- También se bloquea registrarse directamente como admin.

create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;

drop trigger if exists trg_guard_profile_role on public.profiles;
create trigger trg_guard_profile_role
  before insert or update on public.profiles
  for each row execute function public.guard_profile_role();


-- 2. LOS DUEÑOS NO PUEDEN AUTO-VERIFICARSE NI QUITARSE UNA SUSPENSIÓN -------
-- "verified" y "suspended" solo los cambia un admin.

create or replace function public.guard_business_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;

drop trigger if exists trg_guard_business_admin_fields on public.businesses;
create trigger trg_guard_business_admin_fields
  before update on public.businesses
  for each row execute function public.guard_business_admin_fields();

create or replace function public.guard_product_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;

drop trigger if exists trg_guard_product_admin_fields on public.products;
create trigger trg_guard_product_admin_fields
  before update on public.products
  for each row execute function public.guard_product_admin_fields();


-- 3. PEDIDOS Y RESEÑAS HONESTOS -------------------------------------------
-- a) Todo pedido nuevo empieza "pendiente" (nadie puede crearlo ya
--    "completado" para poder reseñar sin comprar).
-- b) Nadie puede comprarle a su propio emprendimiento (así un dueño no puede
--    crearse pedidos falsos, completarlos y dejarse reseñas de 5 estrellas).
-- c) Nadie puede cambiar el comprador ni el emprendimiento de un pedido.

create or replace function public.guard_order_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;

drop trigger if exists trg_guard_order_insert on public.orders;
create trigger trg_guard_order_insert
  before insert on public.orders
  for each row execute function public.guard_order_insert();

create or replace function public.guard_order_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.buyer_id is distinct from old.buyer_id
       or new.business_id is distinct from old.business_id then
      raise exception 'No se puede cambiar el comprador ni el emprendimiento de un pedido.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_order_update on public.orders;
create trigger trg_guard_order_update
  before update on public.orders
  for each row execute function public.guard_order_update();

create or replace function public.guard_review_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and public.is_business_owner(new.business_id) then
    raise exception 'No puedes reseñar tu propio emprendimiento.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_review_insert on public.reviews;
create trigger trg_guard_review_insert
  before insert on public.reviews
  for each row execute function public.guard_review_insert();


-- Comprobación: deberían aparecer los 7 triggers de arriba
select event_object_table as tabla, trigger_name
from information_schema.triggers
where trigger_name like 'trg_guard_%'
order by 1, 2;
