import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Order, OrderStatus } from '../types';
import { demoDb } from '../data/demoDb';
import { businessService } from './businessService';
import { productService } from './productService';
import { demoProfiles } from '../data/demoData';

async function enrichOrder(order: Order): Promise<Order> {
  const business = await businessService.getById(order.business_id);
  const buyer = demoProfiles.find((p) => p.id === order.buyer_id);
  const items = await Promise.all(
    (order.items ?? []).map(async (item) => ({
      ...item,
      product: (await productService.getById(item.product_id)) ?? undefined,
    }))
  );
  return { ...order, business: business ?? undefined, buyer, items };
}

export const orderService = {
  async listByBuyer(buyerId: string): Promise<Order[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('orders')
        .select('*, businesses(*), order_items(*, products(*))')
        .eq('buyer_id', buyerId)
        .order('created_at', { ascending: false });
      return (data as Order[]) ?? [];
    }
    const orders = demoDb
      .getOrders()
      .filter((o) => o.buyer_id === buyerId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return Promise.all(orders.map(enrichOrder));
  },

  async listByBusiness(businessId: string): Promise<Order[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*)), buyer:profiles(*)')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      return (data as Order[]) ?? [];
    }
    const orders = demoDb
      .getOrders()
      .filter((o) => o.business_id === businessId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return Promise.all(orders.map(enrichOrder));
  },

  async getById(id: string): Promise<Order | null> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('orders')
        .select('*, businesses(*), order_items(*, products(*))')
        .eq('id', id)
        .single();
      return (data as Order) ?? null;
    }
    const order = demoDb.getOrders().find((o) => o.id === id);
    return order ? enrichOrder(order) : null;
  },

  /**
   * Crea un pedido de un solo producto (flujo de compra del MVP: paso 1-3).
   * Descuenta stock del producto correspondiente.
   */
  async createOrder(input: {
    buyer_id: string;
    business_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
  }): Promise<{ order: Order | null; error: string | null }> {
    if (input.quantity <= 0) {
      return { order: null, error: 'La cantidad debe ser mayor a cero.' };
    }

    if (isSupabaseConfigured && supabase) {
      const total = input.quantity * input.unit_price;
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          buyer_id: input.buyer_id,
          business_id: input.business_id,
          total,
          status: 'pendiente',
        })
        .select()
        .single();
      if (error) return { order: null, error: error.message };

      const { error: itemError } = await supabase.from('order_items').insert({
        order_id: (order as Order).id,
        product_id: input.product_id,
        quantity: input.quantity,
        unit_price: input.unit_price,
      });
      if (itemError) return { order: null, error: itemError.message };
      return { order: order as Order, error: null };
    }

    // Demo mode
    const product = await productService.getById(input.product_id);
    if (!product || !product.available) {
      return { order: null, error: 'El producto ya no está disponible.' };
    }
    if (product.stock < input.quantity) {
      return { order: null, error: 'No hay suficiente stock disponible.' };
    }

    const total = input.quantity * input.unit_price;
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      buyer_id: input.buyer_id,
      business_id: input.business_id,
      total,
      status: 'pendiente',
      created_at: new Date().toISOString(),
      items: [
        {
          id: `item-${Date.now()}`,
          order_id: `order-${Date.now()}`,
          product_id: input.product_id,
          quantity: input.quantity,
          unit_price: input.unit_price,
        },
      ],
    };
    const orders = demoDb.getOrders();
    orders.unshift(newOrder);
    demoDb.saveOrders(orders);

    // Descontar stock
    await productService.update(product.id, { stock: product.stock - input.quantity });

    return { order: await enrichOrder(newOrder), error: null };
  },

  async updateStatus(orderId: string, status: OrderStatus): Promise<{ error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      return { error: error ? error.message : null };
    }
    const orders = demoDb.getOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return { error: 'Pedido no encontrado.' };
    orders[idx] = { ...orders[idx], status };
    demoDb.saveOrders(orders);
    return { error: null };
  },
};
