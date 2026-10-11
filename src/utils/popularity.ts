import type { Business, Product } from '../types';

// ============================================================================
// POPULARIDAD (orden por defecto del feed)
// ============================================================================
// El puntaje de actividad (visitas, favoritos y pedidos de los últimos 14
// días) lo calcula Supabase en la función product_popularity
// (supabase/migrations/20261011_popularidad.sql). Aquí se le suma:
//   · un poco por la calificación del emprendimiento (máx. 3 puntos), y
//   · un empujón para los productos nuevos, que se apaga en 7 días, para que
//     quien acaba de llegar también se vea y no ganen siempre los mismos.
// ============================================================================

/** Pesos de la actividad. Deben coincidir con la función SQL (solo se usan en modo demo). */
export const ACTIVITY_WEIGHTS = { view: 1, favorite: 3, order: 8 };
export const ACTIVITY_WINDOW_DAYS = 14;
const HALF_LIFE_DAYS = 7;

const NEW_PRODUCT_BOOST = 12;
const NEW_PRODUCT_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Cuánto vale hoy una señal de hace `days` días (la mitad cada 7 días). */
export function decay(days: number): number {
  return Math.pow(0.5, Math.max(0, days) / HALF_LIFE_DAYS);
}

function ratingBonus(business?: Business): number {
  if (!business) return 0;
  const confidence = Math.min(business.review_count ?? 0, 10) / 10;
  return (business.rating ?? 0) * confidence * 0.6;
}

function newProductBoost(createdAt: string): number {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / DAY_MS;
  if (ageDays >= NEW_PRODUCT_DAYS) return 0;
  return NEW_PRODUCT_BOOST * (1 - Math.max(0, ageDays) / NEW_PRODUCT_DAYS);
}

export function productScore(product: Product, activity: Record<string, number>): number {
  return (activity[product.id] ?? 0) + ratingBonus(product.business) + newProductBoost(product.created_at);
}

/** Más populares primero; si empatan, el más reciente. */
export function sortByPopularity(products: Product[], activity: Record<string, number>): Product[] {
  const scores = new Map(products.map((p) => [p.id, productScore(p, activity)]));
  return [...products].sort(
    (a, b) =>
      (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
