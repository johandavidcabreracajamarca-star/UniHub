import type { Product } from '../types';

type DiscountFields = Pick<Product, 'discount_percent' | 'discount_starts_at' | 'discount_ends_at'>;

// Un producto está "en oferta" solo si tiene un porcentaje válido Y la
// fecha/hora actual cae dentro del rango [discount_starts_at,
// discount_ends_at] que configuró el vendedor. Si falta cualquiera de los
// tres datos, no hay oferta activa (aunque los campos existan en la base
// de datos con valores viejos).
export function isProductOnSale(product: DiscountFields): boolean {
  if (!product.discount_percent || product.discount_percent <= 0) return false;
  if (!product.discount_starts_at || !product.discount_ends_at) return false;

  const starts = new Date(product.discount_starts_at).getTime();
  const ends = new Date(product.discount_ends_at).getTime();
  if (Number.isNaN(starts) || Number.isNaN(ends)) return false;

  const now = Date.now();
  return now >= starts && now <= ends;
}

// Precio final ya con el descuento aplicado, redondeado al peso más
// cercano. Si el producto no tiene descuento configurado, devuelve el
// precio normal sin cambios.
export function getDiscountedPrice(product: Pick<Product, 'price' | 'discount_percent'>): number {
  if (!product.discount_percent || product.discount_percent <= 0) return product.price;
  return Math.round(product.price * (1 - product.discount_percent / 100));
}
