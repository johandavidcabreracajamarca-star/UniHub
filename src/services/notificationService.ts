import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Notification, OrderStatus } from '../types';
import { ORDER_STATUS_LABELS } from '../types';
import { demoDb } from '../data/demoDb';

function statusMessage(status: OrderStatus, reason?: string | null): string {
  if (status === 'cancelado') {
    return reason ? `Tu pedido fue cancelado: ${reason}` : 'Tu pedido fue cancelado.';
  }
  return `Tu pedido ahora está: ${ORDER_STATUS_LABELS[status]}.`;
}

export const notificationService = {
  async listByUser(userId: string): Promise<Notification[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);
      return (data as Notification[]) ?? [];
    }
    return demoDb
      .getNotifications()
      .filter((n) => n.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async countUnread(userId: string): Promise<number> {
    if (isSupabaseConfigured && supabase) {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
      return count ?? 0;
    }
    return demoDb.getNotifications().filter((n) => n.user_id === userId && !n.read).length;
  },

  async markAllAsRead(userId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
      return;
    }
    const items = demoDb.getNotifications().map((n) => (n.user_id === userId ? { ...n, read: true } : n));
    demoDb.saveNotifications(items);
  },

  /**
   * Crea la notificación para el comprador cuando cambia el estado de su
   * pedido. La llama orderService internamente; nunca hace falta invocarla
   * a mano desde la UI.
   */
  async notifyOrderStatusChange(input: {
    order_id: string;
    buyer_id: string;
    status: OrderStatus;
    reason?: string | null;
  }): Promise<void> {
    const notification = {
      user_id: input.buyer_id,
      order_id: input.order_id,
      message: statusMessage(input.status, input.reason),
      read: false,
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('notifications').insert(notification);
      return;
    }
    const items = demoDb.getNotifications();
    items.unshift({
      id: `notif-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...notification,
    });
    demoDb.saveNotifications(items);
  },
};
