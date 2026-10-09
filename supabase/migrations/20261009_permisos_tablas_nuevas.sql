-- ============================================================================
-- UNIHUB — PERMISOS PARA LAS TABLAS NUEVAS (9 oct 2026)
-- ============================================================================
-- En proyectos nuevos de Supabase, las tablas creadas por SQL no siempre
-- quedan disponibles para la app. Esto les da acceso a los usuarios con
-- sesión iniciada; las reglas de seguridad (RLS) siguen decidiendo qué filas
-- puede ver o tocar cada uno.
-- Cómo aplicarlo: SQL Editor → New query → pegar todo → Run.
-- ============================================================================

grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select, insert on public.product_views to authenticated;
grant execute on function public.business_favorites_count(uuid) to authenticated;

-- Comprobación: debe mostrar las dos tablas con permisos para "authenticated"
select table_name, string_agg(privilege_type, ', ' order by privilege_type) as permisos
from information_schema.role_table_grants
where grantee = 'authenticated' and table_name in ('push_subscriptions', 'product_views')
group by table_name;
