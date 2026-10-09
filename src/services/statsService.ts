import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { demoDb } from '../data/demoDb';

// ============================================================================
// ESTADÍSTICAS DEL EMPRENDEDOR
// ============================================================================
// Visitas a productos (una por persona, por producto y por día) y número de
// personas que tienen el emprendimiento en favoritos. En Supabase requiere
// correr supabase/migrations/20261009_estadisticas.sql; si la tabla aún no
// existe, todo falla en silencio y el panel simplemente no muestra visitas.
// ============================================================================

const DEMO_VIEWS_KEY = 'unihub_demo_product_views';

interface ViewRow {
  product_id: string;
  view_date: string; // YYYY-MM-DD
}

export interface BusinessStats {
  /** Visitas de los últimos 7 días, de la más antigua a hoy */
  dailyViews: { date: string; views: number }[];
  viewsThisWeek: number;
  viewsLastWeek: number;
  viewsByProduct: Record<string, number>;
  favorites: number | null;
}

function isoDate(d: Date) {
  // Fecha local (Colombia), no UTC
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
}

function loadDemoViews(): (ViewRow & { business_id: string; viewer_id: string })[] {
  try {
    return JSON.parse(localStorage.getItem(DEMO_VIEWS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export const statsService = {
  async recordProductView(input: { productId: string; businessId: string; viewerId: string }): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      // "ignoreDuplicates": si ya la vio hoy, no pasa nada
      await supabase
        .from('product_views')
        .upsert(
          { product_id: input.productId, business_id: input.businessId, viewer_id: input.viewerId },
          { onConflict: 'product_id,viewer_id,view_date', ignoreDuplicates: true }
        );
      return;
    }
    const rows = loadDemoViews();
    const today = isoDate(new Date());
    if (rows.some((r) => r.product_id === input.productId && r.viewer_id === input.viewerId && r.view_date === today)) return;
    rows.push({ product_id: input.productId, business_id: input.businessId, viewer_id: input.viewerId, view_date: today });
    try {
      localStorage.setItem(DEMO_VIEWS_KEY, JSON.stringify(rows));
    } catch {
      // ignorar
    }
  },

  async getBusinessStats(businessId: string): Promise<BusinessStats> {
    const since = daysAgo(13);
    let rows: ViewRow[] = [];
    let favorites: number | null = null;

    if (isSupabaseConfigured && supabase) {
      const [viewsRes, favRes] = await Promise.all([
        supabase.from('product_views').select('product_id, view_date').eq('business_id', businessId).gte('view_date', since),
        supabase.rpc('business_favorites_count', { biz_id: businessId }),
      ]);
      rows = (viewsRes.data as ViewRow[] | null) ?? [];
      favorites = typeof favRes.data === 'number' ? favRes.data : null;
    } else {
      rows = loadDemoViews().filter((r) => r.business_id === businessId && r.view_date >= since);
      favorites = demoDb.getFavoritesRaw().filter((f) => f.business_id === businessId).length;
    }

    const weekStart = daysAgo(6);
    const dailyViews = Array.from({ length: 7 }, (_, i) => {
      const date = daysAgo(6 - i);
      return { date, views: rows.filter((r) => r.view_date === date).length };
    });
    const thisWeek = rows.filter((r) => r.view_date >= weekStart);
    const viewsByProduct: Record<string, number> = {};
    for (const r of thisWeek) viewsByProduct[r.product_id] = (viewsByProduct[r.product_id] ?? 0) + 1;

    return {
      dailyViews,
      viewsThisWeek: thisWeek.length,
      viewsLastWeek: rows.length - thisWeek.length,
      viewsByProduct,
      favorites,
    };
  },
};
