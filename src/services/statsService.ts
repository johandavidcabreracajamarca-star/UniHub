import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { demoDb } from '../data/demoDb';
import { ACTIVITY_WEIGHTS, ACTIVITY_WINDOW_DAYS, decay } from '../utils/popularity';

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

const DAY_MS = 24 * 60 * 60 * 1000;

// El feed y "Destacados" piden los puntajes casi al mismo tiempo: se guardan
// un minuto para no consultar dos veces.
export interface PopularityScores {
  /** Actividad de cada producto (solo los que tienen actividad) */
  byProduct: Record<string, number>;
  /** Suma de la actividad de los productos de cada emprendimiento */
  byBusiness: Record<string, number>;
}

let popularityCache: { at: number; promise: Promise<PopularityScores> } | null = null;

function emptyScores(): PopularityScores {
  return { byProduct: {}, byBusiness: {} };
}

async function fetchPopularity(): Promise<PopularityScores> {
  const result = emptyScores();
  const add = (productId: string, businessId: string, pts: number) => {
    result.byProduct[productId] = (result.byProduct[productId] ?? 0) + pts;
    result.byBusiness[businessId] = (result.byBusiness[businessId] ?? 0) + pts;
  };

  if (isSupabaseConfigured && supabase) {
    // Si la función aún no existe en Supabase, el feed queda por recientes
    const { data, error } = await supabase.rpc('product_popularity');
    if (error || !data) return result;
    for (const row of data as { product_id: string; business_id: string; score: number | string }[]) {
      add(row.product_id, row.business_id, Number(row.score));
    }
    return result;
  }

  // Modo demo: misma fórmula que la función SQL
  const now = Date.now();
  const daysSince = (iso: string) => (now - new Date(iso).getTime()) / DAY_MS;
  const products = demoDb.getProducts();
  const businessOf = new Map(products.map((p) => [p.id, p.business_id]));

  const since = daysAgo(ACTIVITY_WINDOW_DAYS - 1);
  const today = new Date(isoDate(new Date())).getTime();
  for (const v of loadDemoViews()) {
    if (v.view_date < since) continue;
    const days = (today - new Date(v.view_date).getTime()) / DAY_MS;
    add(v.product_id, v.business_id, ACTIVITY_WEIGHTS.view * decay(days));
  }
  for (const o of demoDb.getOrders()) {
    if (!['confirmado', 'en_preparacion', 'completado'].includes(o.status)) continue;
    const days = daysSince(o.created_at);
    if (days > ACTIVITY_WINDOW_DAYS) continue;
    for (const productId of new Set((o.items ?? []).map((i) => i.product_id))) {
      add(productId, businessOf.get(productId) ?? o.business_id, ACTIVITY_WEIGHTS.order * decay(days));
    }
  }
  for (const f of demoDb.getFavoritesRaw()) {
    const days = daysSince(f.created_at);
    if (days > ACTIVITY_WINDOW_DAYS) continue;
    for (const p of products) {
      if (p.business_id === f.business_id) add(p.id, p.business_id, ACTIVITY_WEIGHTS.favorite * decay(days));
    }
  }
  return result;
}

export const statsService = {
  /** Puntaje de actividad de los últimos 14 días, por producto y por emprendimiento. */
  getPopularityScores(): Promise<PopularityScores> {
    if (!popularityCache || Date.now() - popularityCache.at > 60_000) {
      popularityCache = { at: Date.now(), promise: fetchPopularity().catch(emptyScores) };
    }
    return popularityCache.promise;
  },

  async recordProductView(input: { productId: string; businessId: string; viewerId: string }): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      // Insert normal, no upsert: el "on conflict" de un upsert le exige a
      // Postgres poder leer la fila, y el visitante no puede leer las visitas
      // (solo el dueño), así que el upsert siempre era rechazado.
      // Si ya la vio hoy, la restricción única falla (23505) y no pasa nada.
      await supabase
        .from('product_views')
        .insert({ product_id: input.productId, business_id: input.businessId, viewer_id: input.viewerId });
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
