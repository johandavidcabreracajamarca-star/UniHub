import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { demoDb } from '../data/demoData';
import type { Business } from '../types';

export const favoriteService = {
  async listFavoriteBusinesses(userId: string): Promise<Business[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('favorites')
        .select('business:businesses(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      return data
        .map((row) => (row as unknown as { business: Business | null }).business)
        .filter((b): b is Business => b !== null);
    }
    return demoDb.getFavoriteBusinesses(userId);
  },

  async listFavoriteIds(userId: string): Promise<Set<string>> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('favorites').select('business_id').eq('user_id', userId);
      if (error || !data) return new Set();
      return new Set(data.map((row) => row.business_id as string));
    }
    return new Set(demoDb.getFavoriteIds(userId));
  },

  async isFavorite(userId: string, businessId: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('business_id', businessId)
        .maybeSingle();
      return Boolean(data);
    }
    return demoDb.getFavoriteIds(userId).includes(businessId);
  },

  async add(userId: string, businessId: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('favorites').insert({ user_id: userId, business_id: businessId });
      return;
    }
    demoDb.addFavorite(userId, businessId);
  },

  async remove(userId: string, businessId: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('favorites').delete().eq('user_id', userId).eq('business_id', businessId);
      return;
    }
    demoDb.removeFavorite(userId, businessId);
  },
};
