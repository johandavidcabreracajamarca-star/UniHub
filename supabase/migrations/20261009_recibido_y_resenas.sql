-- ============================================================================
-- UNIHUB — "YA RECIBÍ MI PEDIDO" Y MÁS RESEÑAS (9 oct 2026)
-- ============================================================================
-- Cómo aplicarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Se puede correr más de una vez sin problema. Los caracteres especiales van
-- como códigos Unicode (U&'\00F3' = ó) para que no se dañen al copiar.
--
-- 1. El comprador puede confirmar que recibió su pedido. Si el emprendedor
--    aún no lo había marcado como entregado, el pedido se completa; el
--    emprendedor recibe el aviso "Pedido recibido ✅".
--    Solo se puede confirmar si el emprendedor ya aceptó el pedido (así nadie
--    puede inventarse un pedido completado para dejar una reseña falsa).
-- 2. Una vez confirmado por el comprador, el estado del pedido ya no cambia.
-- 3. Cada notificación puede tener su propio título (lo usa la función de
--    avisos send-push).
-- 4. Cuando alguien deja una reseña, el emprendedor recibe "Nueva reseña ⭐".
-- ============================================================================


-- 1. Columnas nuevas ----------------------------------------------------------
alter table public.orders add column if not exists buyer_confirmed_at timestamptz;
alter table public.notifications add column if not exists title text;


-- 2. Confirmar que se recibió el pedido (solo el comprador) ------------------
create or replace function public.confirm_order_received(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_owner uuid;
  v_buyer_name text;
  v_item text;
begin
  select * into v_order from public.orders where id = p_order_id;
  if not found or v_order.buyer_id is distinct from auth.uid() then
    raise exception 'Pedido no encontrado.';
  end if;
  if v_order.buyer_confirmed_at is not null then
    return; -- ya estaba confirmado
  end if;
  if v_order.status::text not in ('confirmado', 'en_preparacion', 'completado') then
    raise exception U&'Podr\00E1s confirmarlo cuando el emprendedor acepte tu pedido.';
  end if;

  -- Permiso para que la regla trg_guard_order_update deje pasar este cambio
  perform set_config('unihub.confirming_receipt', 'on', true);
  update public.orders
     set buyer_confirmed_at = now(),
         status = 'completado'
   where id = p_order_id;

  select b.owner_id into v_owner from public.businesses b where b.id = v_order.business_id;
  select split_part(pr.full_name, ' ', 1) into v_buyer_name from public.profiles pr where pr.id = v_order.buyer_id;
  select oi.quantity || U&' \00D7 ' || p.name
    into v_item
    from public.order_items oi
    join public.products p on p.id = oi.product_id
   where oi.order_id = p_order_id
   limit 1;

  if v_owner is not null then
    -- "Camila confirmó que recibió 2 × Brownie con nueces."
    insert into public.notifications (user_id, order_id, message, read, link, title)
    values (
      v_owner,
      p_order_id,
      coalesce(nullif(v_buyer_name, ''), 'Tu cliente') || U&' confirm\00F3 que recibi\00F3 '
        || coalesce(v_item, 'su pedido') || '.',
      false,
      '/dashboard/orders',
      U&'Pedido recibido \2705'
    );
  end if;
end;
$$;

grant execute on function public.confirm_order_received(uuid) to authenticated;


-- 3. Reglas del pedido (reemplaza la versión anterior de esta misma función) --
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
    -- Solo confirm_order_received puede marcar la confirmación del comprador
    if new.buyer_confirmed_at is distinct from old.buyer_confirmed_at
       and coalesce(current_setting('unihub.confirming_receipt', true), '') <> 'on' then
      raise exception U&'Solo el comprador puede confirmar que recibi\00F3 el pedido.';
    end if;
    -- Si el comprador ya confirmó, el pedido queda cerrado
    if old.buyer_confirmed_at is not null and new.status is distinct from old.status then
      raise exception U&'El comprador ya confirm\00F3 que recibi\00F3 este pedido.';
    end if;
  end if;
  return new;
end;
$$;


-- 4. Aviso al emprendedor cuando recibe una reseña ---------------------------
create or replace function public.notify_seller_new_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_name text;
begin
  select b.owner_id into v_owner from public.businesses b where b.id = new.business_id;
  if v_owner is null then
    return new;
  end if;
  select split_part(pr.full_name, ' ', 1) into v_name from public.profiles pr where pr.id = new.buyer_id;

  -- "Camila te dio ★★★★★: “¡Los mejores brownies!”"
  insert into public.notifications (user_id, order_id, message, read, link, title)
  values (
    v_owner,
    new.order_id,
    coalesce(nullif(v_name, ''), 'Un estudiante') || ' te dio '
      || repeat(U&'\2605', greatest(1, least(5, new.rating)))
      || coalesce(U&': \201C' || nullif(left(trim(new.comment), 80), '') || U&'\201D', ''),
    false,
    '/dashboard',
    U&'Nueva rese\00F1a \2B50'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_seller_new_review on public.reviews;
create trigger trg_notify_seller_new_review
  after insert on public.reviews
  for each row execute function public.notify_seller_new_review();


-- Comprobación
select 'listo' as estado,
       (select count(*) from information_schema.columns
         where table_name = 'orders' and column_name = 'buyer_confirmed_at') as columna_pedidos,
       (select count(*) from information_schema.columns
         where table_name = 'notifications' and column_name = 'title') as columna_titulo;
