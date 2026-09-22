import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { ProductVariant } from '../types';
import { demoDb } from '../data/demoDb';

export interface VariantInput {
  name: string;
  price: number;
  stock: number;
}

export const productVariantService = {
  async listByProduct(productId: string): Promise<ProductVariant[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });
      return (data as ProductVariant[]) ?? [];
    }
    const product = demoDb.getProducts().find((p) => p.id === productId);
    return product?.variants ?? [];
  },

  // Reemplaza todas las variantes de un producto por la lista dada. Se usa
  // tanto al crear como al editar: es más simple que calcular qué variante
  // se agregó/quitó/cambió, y no rompe el historial de pedidos porque cada
  // order_item ya guarda su propio variant_name (ver supabase/schema.sql).
  async replaceForProduct(
    productId: string,
    variants: VariantInput[]
  ): Promise<{ error: string | null }> {
    for (const v of variants) {
      if (!v.name.trim() || Number.isNaN(v.price) || v.price < 0 || Number.isNaN(v.stock) || v.stock < 0) {
        return { error: 'Revisa el nombre, precio y stock de cada variante.' };
      }
    }

    if (isSupabaseConfigured && supabase) {
      const { error: delError } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', productId);
      if (delError) return { error: delError.message };

      if (variants.length === 0) return { error: null };

      const { error: insError } = await supabase.from('product_variants').insert(
        variants.map((v) => ({
          product_id: productId,
          name: v.name.trim(),
          price: v.price,
          stock: v.stock,
        }))
      );
      return { error: insError ? insError.message : null };
    }

    // Modo demo: las variantes viven embebidas dentro del producto.
    const products = demoDb.getProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) return { error: 'Producto no encontrado.' };
    const now = new Date().toISOString();
    products[idx] = {
      ...products[idx],
      variants: variants.map((v, i) => ({
        id: `variant-${Date.now()}-${i}`,
        product_id: productId,
        name: v.name.trim(),
        price: v.price,
        stock: v.stock,
        created_at: now,
      })),
    };
    demoDb.saveProducts(products);
    return { error: null };
  },

  // Solo se usa en modo demo — en Supabase el trigger
  // trg_decrement_stock_on_order_item se encarga de esto automáticamente.
  async decrementDemoStock(productId: string, variantId: string, quantity: number): Promise<void> {
    const products = demoDb.getProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1 || !products[idx].variants) return;
    products[idx] = {
      ...products[idx],
      variants: products[idx].variants!.map((v) =>
        v.id === variantId ? { ...v, stock: Math.max(0, v.stock - quantity) } : v
      ),
    };
    demoDb.saveProducts(products);
  },
};
