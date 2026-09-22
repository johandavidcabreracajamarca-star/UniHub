import type { Product, ProductVariant } from '../types';

export function hasVariants(product: Product): boolean {
  return Boolean(product.variants && product.variants.length > 0);
}

// Rango de precios entre las variantes de un producto, para mostrar
// "Desde $X" en el feed cuando las variantes tienen precios distintos.
// Devuelve null si el producto no tiene variantes.
export function getVariantPriceRange(product: Product): { min: number; max: number } | null {
  if (!product.variants || product.variants.length === 0) return null;
  const prices = product.variants.map((v) => v.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

// Un producto con variantes se considera agotado cuando todas sus variantes
// están en 0, sin importar el stock del producto en sí (que ya no se usa
// cuando hay variantes). Para productos sin variantes no cambia nada: sigue
// mandando solo el interruptor "Disponible para la venta" del emprendedor.
export function isProductSoldOut(product: Product): boolean {
  if (!product.available) return true;
  if (product.variants && product.variants.length > 0) {
    return product.variants.every((v) => v.stock <= 0);
  }
  return false;
}

export function totalVariantStock(product: Product): number {
  if (!product.variants) return 0;
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

export function isVariantAvailable(variant: ProductVariant): boolean {
  return variant.stock > 0;
}
