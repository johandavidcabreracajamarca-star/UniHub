-- ============================================================================
-- UNIHUB — AJUSTE A LA REGLA DE PEDIDOS (9 oct 2026)
-- ============================================================================
-- La regla trg_guard_order_update bloqueaba confirmar pedidos porque la base
-- de datos ya tenía otra regla automática que modifica el pedido al cambiar
-- su estado. Ahora solo se impide cambiar el comprador o el emprendimiento.
-- Cómo aplicarlo: SQL Editor → New query → pegar todo → Run.
-- ============================================================================

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

-- Para revisar: otras reglas automáticas que existen sobre la tabla de pedidos
select trigger_name, action_timing, event_manipulation, action_statement
from information_schema.triggers
where event_object_table = 'orders'
order by trigger_name;
