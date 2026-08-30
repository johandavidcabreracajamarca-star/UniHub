import type { ProductCategory } from '../types';

// ============================================================================
// IMÁGENES AUTOMÁTICAS POR CATEGORÍA
// ============================================================================
// Cuando un producto no tiene una imagen asignada manualmente, generamos una
// URL que trae una foto real de internet relacionada con su categoría, usando
// LoremFlickr (servicio público y gratuito, sin necesidad de API key).
//
// IMPORTANTE: LoremFlickr busca por palabras en INGLÉS. Antes intentábamos
// traducir el nombre del producto tal cual lo escribe el vendedor (ej. "torta"),
// pero como el servicio no entiende español, no encontraba coincidencia y
// devolvía una foto genérica sin relación (por eso aparecía siempre la misma
// imagen de un gato). La solución: usar solo palabras clave en inglés,
// tomadas de una lista curada por categoría — así la foto siempre es
// coherente con el tipo de producto, aunque no sea 100% específica al
// nombre exacto.
//
// El "lock" fija siempre la misma foto para el mismo producto, para que no
// cambie cada vez que se recarga la página.
// ============================================================================

// Varias palabras en inglés por categoría, para dar variedad entre productos
// de la misma categoría sin depender de traducir el nombre escrito por el
// vendedor.
const CATEGORY_KEYWORD_POOL: Record<ProductCategory, string[]> = {
  comida: ['food', 'meal', 'snack', 'bakery', 'dessert', 'cooking'],
  ropa: ['clothing', 'fashion', 'apparel', 'shirt', 'outfit'],
  tecnologia: ['technology', 'gadget', 'electronics', 'computer', 'device'],
  accesorios: ['accessories', 'jewelry', 'bag', 'watch'],
  servicios: ['service', 'work', 'business', 'consulting'],
  otros: ['shop', 'store', 'product', 'market'],
};

/** Convierte una clave (p. ej. el id del producto) en un número estable. */
function stableSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash >>> 0;
}

export function getAutoProductImage(
  name: string,
  category: ProductCategory,
  seedKey: string
): string {
  const seed = stableSeed(seedKey || name);
  const pool = CATEGORY_KEYWORD_POOL[category] ?? CATEGORY_KEYWORD_POOL.otros;
  // Elegimos una palabra del pool de forma estable (siempre la misma para
  // el mismo producto), para variar entre productos de la misma categoría.
  const keyword = pool[seed % pool.length];
  const lock = (seed % 9999) + 1;
  return `https://loremflickr.com/480/480/${keyword}?lock=${lock}`;
}
