-- ============================================================================
-- UNIHUB — TOTAL CORRECTO EN EL AVISO DE VENTA (9 oct 2026)
-- ============================================================================
-- Cómo aplicarlo: Supabase → SQL Editor → New query → pegar todo → Run.
--
-- El aviso decía "$0" porque tomaba el total del pedido antes de que la base
-- de datos lo calculara. Ahora usa cantidad × precio del producto comprado.
-- También corrige los avisos de venta que ya salieron con "$0".
-- Los caracteres especiales van como códigos (U&'\00F3' = ó, \00D7 = ×,
-- \00B7 = ·) para que no se dañen al copiar.
-- ============================================================================

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
$$;

-- Corregir los avisos de venta que ya salieron con "$0"
update public.notifications n
set message = left(n.message, length(n.message) - 2)
  || '$' || replace(to_char(i.amount, 'FM999,999,999'), ',', '.')
from (
  select order_id, sum(quantity * unit_price) as amount
  from public.order_items
  group by order_id
) i
where n.order_id = i.order_id
  and n.link = '/dashboard/orders'
  and n.message like '%$0'
  and i.amount > 0;

-- Comprobación: últimos avisos de venta
select message, created_at
from public.notifications
where link = '/dashboard/orders'
order by created_at desc
limit 3;
