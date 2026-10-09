-- ============================================================================
-- UNIHUB — ARREGLO DE AVISOS (9 oct 2026)
-- ============================================================================
-- Cómo aplicarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Se puede correr más de una vez sin problema.
--
-- 1. La función send-push respondía {"sent":0,"total":0} porque el usuario
--    de servidor (service_role) no tenía permiso para leer las tablas nuevas
--    (igual que pasó con la app antes de 20261009_permisos_tablas_nuevas.sql).
-- 2. El texto del aviso de venta se había dañado al copiarlo ("√≥" en vez
--    de "ó"). Ahora los caracteres especiales van como códigos Unicode
--    (U&'\00F3' = ó, \00D7 = ×, \00B7 = ·), así no se dañan al copiar.
-- ============================================================================


-- 1. Permisos para la función send-push --------------------------------------
grant select, insert, update, delete on public.push_subscriptions to service_role;
grant select, insert, update, delete on public.product_views to service_role;
grant select on public.notifications, public.conversations, public.businesses,
  public.profiles, public.orders to service_role;


-- 2. Aviso de venta con el texto correcto ------------------------------------
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

  -- "Camila te pidió 2 × Caja de 6 cupcakes · $24.000"
  insert into public.notifications (user_id, order_id, message, read, link)
  values (
    v_owner,
    new.order_id,
    coalesce(nullif(v_buyer_name, ''), 'Un estudiante') || U&' te pidi\00F3 '
      || new.quantity || U&' \00D7 ' || coalesce(v_product, 'un producto')
      || coalesce(' (' || nullif(new.variant_name, '') || ')', '')
      || U&' \00B7 $' || replace(to_char(coalesce(v_total, new.quantity * new.unit_price), 'FM999,999,999'), ',', '.'),
    false,
    '/dashboard/orders'
  );
  return new;
end;
$$;

-- Corrige el texto de los avisos de venta que ya se hayan creado dañados
update public.notifications
set message = replace(replace(replace(message,
      U&'\221A\2265', U&'\00F3'),   -- "√≥" → "ó"
      U&'\221A\00F3', U&'\00D7'),   -- "√ó" → "×"
      U&'\00AC\2211', U&'\00B7')    -- "¬∑" → "·"
where link = '/dashboard/orders';


-- Comprobación: permisos de service_role sobre push_subscriptions
select 'service_role puede' as que, string_agg(privilege_type, ', ' order by privilege_type) as detalle
from information_schema.role_table_grants
where grantee = 'service_role' and table_name = 'push_subscriptions';
