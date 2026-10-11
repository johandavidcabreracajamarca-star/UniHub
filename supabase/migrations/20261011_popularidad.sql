-- ============================================================================
-- UNIHUB — POPULARIDAD PARA ORDENAR EL FEED (11 oct 2026)
-- ============================================================================
-- Cómo aplicarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Se puede correr más de una vez sin problema.
--
-- Calcula un puntaje de actividad por producto con lo que pasó en los últimos
-- 14 días. Lo reciente pesa más: cada señal pierde la mitad de su valor cada
-- 7 días.
--   · Visita al producto ............................ 1 punto
--   · Alguien guarda el emprendimiento en favoritos .. 3 puntos (a cada producto)
--   · Pedido confirmado, en preparación o entregado .. 8 puntos
-- Las visitas ya cuentan máximo 1 por persona, producto y día, y las del dueño
-- no se guardan. Los pedidos pendientes o cancelados no cuentan.
--
-- La función solo devuelve el puntaje final: nadie puede ver quién visitó,
-- guardó o compró. La app le suma la calificación y un empujón para los
-- productos nuevos (src/utils/popularity.ts).
-- ============================================================================

-- Si ya existía con otras columnas, se borra primero (no se puede cambiar
-- lo que devuelve una función con "create or replace")
drop function if exists public.product_popularity();

create function public.product_popularity()
returns table (product_id uuid, business_id uuid, score numeric)
language sql
stable
security definer
set search_path = public
as $$
  with
  visitas as (
    select pv.product_id,
           sum(power(0.5, ((now() at time zone 'America/Bogota')::date - pv.view_date) / 7.0)) as pts
    from product_views pv
    where pv.view_date >= (now() at time zone 'America/Bogota')::date - 13
    group by pv.product_id
  ),
  pedidos as (
    select items.product_id,
           8 * sum(power(0.5, extract(epoch from now() - o.created_at) / 86400 / 7.0)) as pts
    from (select distinct order_id, product_id from order_items where product_id is not null) items
    join orders o on o.id = items.order_id
    where o.status in ('confirmado', 'en_preparacion', 'completado')
      and o.created_at >= now() - interval '14 days'
    group by items.product_id
  ),
  favoritos as (
    select f.business_id,
           3 * sum(power(0.5, extract(epoch from now() - f.created_at) / 86400 / 7.0)) as pts
    from favorites f
    where f.created_at >= now() - interval '14 days'
    group by f.business_id
  )
  select p.id as product_id,
         p.business_id,
         round((coalesce(v.pts, 0) + coalesce(pe.pts, 0) + coalesce(fa.pts, 0))::numeric, 2) as score
  from products p
  left join visitas v on v.product_id = p.id
  left join pedidos pe on pe.product_id = p.id
  left join favoritos fa on fa.business_id = p.business_id
  where coalesce(v.pts, 0) + coalesce(pe.pts, 0) + coalesce(fa.pts, 0) > 0;
$$;

-- Se puede consultar sin cuenta (el feed se explora sin iniciar sesión)
grant execute on function public.product_popularity() to anon, authenticated, service_role;

-- Comprobación: los 5 productos con más puntaje
select p.name as producto, pp.score as puntaje
from public.product_popularity() pp
join public.products p on p.id = pp.product_id
order by pp.score desc
limit 5;
