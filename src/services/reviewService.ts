import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Review } from '../types';
import { demoDb } from '../data/demoDb';
import { orderService } from './orderService';

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
      return (data as Review[]) ?? [];
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
    return { error: null };
  },
};
