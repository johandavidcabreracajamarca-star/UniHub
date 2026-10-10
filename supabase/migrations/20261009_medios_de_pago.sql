-- ============================================================================
-- UNIHUB — MEDIOS DE PAGO (9 oct 2026)
-- ============================================================================
-- Cómo aplicarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Se puede correr más de una vez sin problema. Los caracteres especiales van
-- como códigos Unicode (U&'\00F3' = ó) para que no se dañen al copiar.
--
-- 1. Cada emprendimiento indica cómo recibe pagos: efectivo, Nequi,
--    Daviplata o transferencia (Bre-B o banco). Esto lo ve todo el mundo.
-- 2. El número de Nequi/Daviplata y los datos de transferencia se guardan
--    aparte, en una tabla que solo puede leer el dueño.
-- 3. Cada pedido guarda cómo va a pagar el comprador.
-- 4. El comprador ve los datos para pagar SOLO de su propio pedido y SOLO
--    cuando el emprendedor ya lo aceptó (así nadie paga un pedido que no se
--    va a atender, y los números no quedan a la vista de todos).
-- ============================================================================


-- 1. Medios de pago aceptados (públicos) -------------------------------------
alter table public.businesses
  add column if not exists payment_methods text[] not null default '{}';

alter table public.businesses drop constraint if exists businesses_payment_methods_check;
alter table public.businesses add constraint businesses_payment_methods_check
  check (payment_methods <@ array['efectivo', 'nequi', 'daviplata', 'transferencia']::text[]);


-- 2. Datos para pagar (privados del dueño) -----------------------------------
create table if not exists public.business_payment_details (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  nequi_phone text,
  daviplata_phone text,
  transfer_details text,
  updated_at timestamptz not null default now(),
  constraint business_payment_details_nequi_check check (nequi_phone is null or nequi_phone ~ '^3[0-9]{9}$'),
  constraint business_payment_details_daviplata_check check (daviplata_phone is null or daviplata_phone ~ '^3[0-9]{9}$'),
  constraint business_payment_details_transfer_check check (transfer_details is null or char_length(transfer_details) <= 160)
);

alter table public.business_payment_details enable row level security;

drop policy if exists "payment_details_select_owner" on public.business_payment_details;
create policy "payment_details_select_owner" on public.business_payment_details
  for select using (public.is_business_owner(business_id));

drop policy if exists "payment_details_insert_owner" on public.business_payment_details;
create policy "payment_details_insert_owner" on public.business_payment_details
  for insert with check (public.is_business_owner(business_id));

drop policy if exists "payment_details_update_owner" on public.business_payment_details;
create policy "payment_details_update_owner" on public.business_payment_details
  for update using (public.is_business_owner(business_id)) with check (public.is_business_owner(business_id));

drop policy if exists "payment_details_delete_owner" on public.business_payment_details;
create policy "payment_details_delete_owner" on public.business_payment_details
  for delete using (public.is_business_owner(business_id));

grant select, insert, update, delete on public.business_payment_details to authenticated;
grant select, insert, update, delete on public.business_payment_details to service_role;


-- 3. Cómo va a pagar cada pedido ---------------------------------------------
alter table public.orders add column if not exists payment_method text;

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method is null or payment_method in ('efectivo', 'nequi', 'daviplata', 'transferencia'));


-- 4. Datos para pagar un pedido (solo su comprador, ya aceptado) -------------
create or replace function public.get_order_payment_info(p_order_id uuid)
returns table (method text, account text)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_details public.business_payment_details%rowtype;
begin
  select * into v_order from public.orders o where o.id = p_order_id;
  if not found or v_order.buyer_id is distinct from auth.uid() then
    return;
  end if;
  if v_order.payment_method is null or v_order.payment_method = 'efectivo' then
    return;
  end if;
  if v_order.status::text not in ('confirmado', 'en_preparacion', 'completado') then
    return;
  end if;

  select * into v_details from public.business_payment_details d where d.business_id = v_order.business_id;
  if not found then
    return;
  end if;

  method := v_order.payment_method;
  account := case v_order.payment_method
    when 'nequi' then v_details.nequi_phone
    when 'daviplata' then v_details.daviplata_phone
    else v_details.transfer_details
  end;
  if account is not null then
    return next;
  end if;
end;
$$;

grant execute on function public.get_order_payment_info(uuid) to authenticated;


-- Comprobación
select 'listo' as estado,
       (select count(*) from information_schema.columns
         where table_name = 'businesses' and column_name = 'payment_methods') as columna_negocios,
       (select count(*) from information_schema.columns
         where table_name = 'orders' and column_name = 'payment_method') as columna_pedidos,
       (select count(*) from information_schema.tables
         where table_name = 'business_payment_details') as tabla_datos;
