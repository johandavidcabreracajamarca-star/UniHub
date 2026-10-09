-- ============================================================================
-- UNIHUB — AVISO DE VENTA AL EMPRENDEDOR (9 oct 2026)
-- ============================================================================
-- Cómo aplicarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Se puede correr más de una vez sin problema.
--
-- 1. Cada notificación guarda a dónde debe llevar al tocarla.
-- 2. Cuando alguien hace un pedido, el emprendedor recibe la notificación
--    "Camila te pidió 2 × Caja de 6 cupcakes · $24.000" (en la campanita y,
--    si tiene los avisos activados, en el celular).
-- 3. La suscripción de avisos de un celular queda siempre a nombre de quien
--    tiene la sesión abierta (útil si en un mismo celular se cambia de cuenta).
-- Al final muestra un diagnóstico de los últimos avisos enviados.
-- ============================================================================


-- 1. A dónde lleva cada notificación ----------------------------------------
alter table public.notifications add column if not exists link text;


-- 2. Aviso al emprendedor cuando recibe un pedido ---------------------------
create or replace function public.notify_seller_new_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_buyer uuid;
  v_total numeric;
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

  select p.name into v_product from public.products p where p.id = new.product_id;
  select split_part(pr.full_name, ' ', 1) into v_buyer_name from public.profiles pr where pr.id = v_buyer;

  insert into public.notifications (user_id, order_id, message, read, link)
  values (
    v_owner,
    new.order_id,
    coalesce(nullif(v_buyer_name, ''), 'Un estudiante') || ' te pidió '
      || new.quantity || ' × ' || coalesce(v_product, 'un producto')
      || coalesce(' (' || nullif(new.variant_name, '') || ')', '')
      || ' · $' || replace(to_char(coalesce(v_total, new.quantity * new.unit_price), 'FM999,999,999'), ',', '.'),
    false,
    '/dashboard/orders'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_seller_new_order on public.order_items;
create trigger trg_notify_seller_new_order
  after insert on public.order_items
  for each row execute function public.notify_seller_new_order();


-- 3. Guardar la suscripción a nombre de quien tiene la sesión abierta -------
create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión para activar los avisos.';
  end if;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update
    set user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        created_at = now();
end;
$$;

grant execute on function public.save_push_subscription(text, text, text) to authenticated;


-- Diagnóstico: últimas llamadas a la función send-push, celulares con avisos
-- activados y últimas notificaciones (los ids salen recortados a 8 letras).
select 'llamada a send-push' as que,
       coalesce(r.status_code::text, 'sin respuesta') || ' · '
         || coalesce(left(r.content, 300), r.error_msg, '') as detalle,
       r.created as cuando
from (select * from net._http_response order by created desc limit 5) r
union all
select 'celular con avisos',
       'usuario ' || left(s.user_id::text, 8) || ' · ' || split_part(s.endpoint, '/', 3),
       s.created_at
from public.push_subscriptions s
union all
select 'notificación',
       'para ' || left(n.user_id::text, 8) || ' · ' || n.message,
       n.created_at
from (select * from public.notifications order by created_at desc limit 4) n
order by 3 desc nulls last;
