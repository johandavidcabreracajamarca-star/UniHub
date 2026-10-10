import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Review } from '../types';
import { demoDb } from '../data/demoDb';
import { orderService } from './orderService';
import { demoProfiles } from '../data/demoData';

function recalcBusinessRating(businessId: string) {
  const reviews = demoDb.getReviews().filter((r) => r.business_id === businessId);
  const businesses = demoDb.getBusinesses();
  const idx = businesses.findIndex((b) => b.id === businessId);
  if (idx === -1) return;
  const rating =
    reviews.length === 0
      ? 0
      : Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10;
  businesses[idx] = { ...businesses[idx], rating, review_count: reviews.length };
  demoDb.saveBusinesses(businesses);
}

export const reviewService = {
  async listByBusiness(businessId: string): Promise<Review[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('reviews')
        .select('*, profiles(full_name)')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      type Row = Review & { profiles?: { full_name?: string } | null };
      return ((data as Row[]) ?? []).map(({ profiles, ...r }) => ({
        ...r,
        buyer_name: r.buyer_name ?? profiles?.full_name ?? undefined,
      }));
    }
    return demoDb
      .getReviews()
      .filter((r) => r.business_id === businessId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async canReview(orderId: string): Promise<boolean> {
    const order = await orderService.getById(orderId);
    if (!order || order.status !== 'completado') return false;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('reviews').select('id').eq('order_id', orderId).maybeSingle();
      return !data;
    }
    return !demoDb.getReviews().some((r) => r.order_id === orderId);
  },

  async create(input: {
    order_id: string;
    buyer_id: string;
    business_id: string;
    rating: number;
    comment: string;
  }): Promise<{ error: string | null }> {
    const eligible = await this.canReview(input.order_id);
    if (!eligible) {
      return { error: 'Este pedido no es elegible para reseña o ya fue calificado.' };
    }
    if (input.rating < 1 || input.rating > 5) {
      return { error: 'La calificación debe estar entre 1 y 5 estrellas.' };
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('reviews').insert(input);
      return { error: error ? error.message : null };
    }

    const reviews = demoDb.getReviews();
    reviews.unshift({
      id: `review-${Date.now()}`,
      order_id: input.order_id,
      buyer_id: input.buyer_id,
      business_id: input.business_id,
      rating: input.rating,
      comment: input.comment,
      created_at: new Date().toISOString(),
      buyer_name: 'Tú',
    });
    demoDb.saveReviews(reviews);
    recalcBusinessRating(input.business_id);

    // Aviso al emprendedor (en Supabase lo crea el trigger trg_notify_seller_new_review)
    const owner = demoDb.getBusinesses().find((b) => b.id === input.business_id)?.owner_id;
    if (owner) {
      const buyerName = demoProfiles.find((p) => p.id === input.buyer_id)?.full_name.split(' ')[0] ?? 'Un estudiante';
      const comment = input.comment.trim().slice(0, 80);
      const notifications = demoDb.getNotifications();
      notifications.unshift({
        id: `notif-${Date.now()}-review`,
        user_id: owner,
        order_id: input.order_id,
        message: `${buyerName} te dio ${'★'.repeat(input.rating)}${comment ? `: “${comment}”` : ''}`,
        read: false,
        created_at: new Date().toISOString(),
        link: '/dashboard',
        title: 'Nueva reseña ⭐',
      });
      demoDb.saveNotifications(notifications);
    }
    return { error: null };
  },
};
