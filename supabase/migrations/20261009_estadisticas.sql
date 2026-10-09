-- ============================================================================
-- UNIHUB — ESTADÍSTICAS PARA EMPRENDEDORES (9 oct 2026)
-- ============================================================================
-- Cómo aplicarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Se puede correr más de una vez sin problema.
--
-- Guarda una "visita" cuando un estudiante abre un producto: como máximo una
-- por persona, por producto y por día (abrirlo 10 veces cuenta como 1).
-- Solo el dueño del emprendimiento (o un admin) puede ver sus visitas; nadie
-- puede ver quién visitó qué.
-- ============================================================================

create table if not exists public.product_views (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  viewer_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  view_date date not null default (now() at time zone 'America/Bogota')::date,
  created_at timestamptz not null default now(),
  unique (product_id, viewer_id, view_date)
);

create index if not exists product_views_business_date_idx
  on public.product_views (business_id, view_date);

alter table public.product_views enable row level security;

-- Registrar una visita: solo a tu nombre, a un producto que sí sea de ese
-- emprendimiento, y sin contar las visitas del propio dueño.
drop policy if exists "product_views_insert_own" on public.product_views;
create policy "product_views_insert_own" on public.product_views
  for insert with check (
    viewer_id = auth.uid()
    and not public.is_business_owner(business_id)
    and exists (
      select 1 from public.products p
      where p.id = product_views.product_id and p.business_id = product_views.business_id
    )
  );

-- Ver visitas: solo el dueño del emprendimiento o un admin
drop policy if exists "product_views_select_owner" on public.product_views;
create policy "product_views_select_owner" on public.product_views
  for select using (public.is_business_owner(business_id) or public.is_admin());

-- Cuántas personas tienen tu emprendimiento en favoritos. Los favoritos son
-- privados de cada usuario, así que el dueño solo recibe el número total.
create or replace function public.business_favorites_count(biz_id uuid)
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select case
    when public.is_business_owner(biz_id) or public.is_admin()
      then (select count(*)::int from public.favorites f where f.business_id = biz_id)
    else null
  end;
$$;

grant execute on function public.business_favorites_count(uuid) to authenticated;

-- Comprobación
select 'product_views' as creado, count(*) as filas from public.product_views;
