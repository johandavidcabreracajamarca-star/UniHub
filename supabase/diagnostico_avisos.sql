-- ============================================================================
-- UNIHUB - DIAGNOSTICO DE AVISOS AL CELULAR (solo lectura, no cambia nada)
-- ============================================================================
-- SQL Editor -> New query -> pegar -> Run. Muestra:
--   * llamada a send-push: lo que respondio la funcion en cada intento
--     ({"sent":1,...} = enviado; "failures" = por que fallo).
--   * celular con avisos: que usuarios tienen avisos activados.
--   * notificacion: a quien iba cada una (ids recortados a 8 letras).
-- ============================================================================
select 'llamada a send-push' as que,
       coalesce(r.status_code::text, 'sin respuesta') || ' - '
         || coalesce(left(r.content, 300), r.error_msg, '') as detalle,
       r.created as cuando
from (select * from net._http_response order by created desc limit 6) r
union all
select 'celular con avisos',
       'usuario ' || left(s.user_id::text, 8) || ' - ' || split_part(s.endpoint, '/', 3),
       s.created_at
from public.push_subscriptions s
union all
select 'notificacion',
       'para ' || left(n.user_id::text, 8) || ' - ' || n.message,
       n.created_at
from (select * from public.notifications order by created_at desc limit 4) n
order by 3 desc nulls last;
