import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Product, ProductCategory } from '../types';
import { demoDb } from '../data/demoDb';
import { businessService } from './businessService';

export interface ProductFilters {
  query?: string;
  category?: ProductCategory | 'todas';
  universityId?: string;
  facultyId?: string;
  onlyAvailable?: boolean;
  minRating?: number;
}

async function enrichWithBusiness(product: Product): Promise<Product> {
  const business = await businessService.getById(product.business_id);
  return { ...product, business: business ?? undefined };
}

export const productService = {
  async listAll(filters: ProductFilters = {}): Promise<Product[]> {
    let products: Product[];

    if (isSupabaseConfigured && supabase) {
      let queryBuilder = supabase
        .from('products')
        .select('*, businesses(*)')
        .order('created_at', { ascending: false });
      if (filters.category && filters.category !== 'todas') {
        queryBuilder = queryBuilder.eq('category', filters.category);
      }
      if (filters.onlyAvailable) {
        queryBuilder = queryBuilder.eq('available', true);
      }
      const { data } = await queryBuilder;
      products = (data as Product[]) ?? [];
    } else {
      const raw = demoDb.getProducts();
      products = await Promise.all(raw.map(enrichWithBusiness));
    }

    return products.filter((p) => {
      if (filters.query) {
        const q = filters.query.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBusiness = p.business?.name.toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        if (!matchesName && !matchesBusiness && !matchesCategory) return false;
      }
      if (filters.category && filters.category !== 'todas' && p.category !== filters.category) {
        return false;
      }
      if (filters.universityId && p.business?.university_id !== filters.universityId) {
        return false;
      }
      if (filters.facultyId && p.business?.faculty_id !== filters.facultyId) {
        return false;
      }
      if (filters.onlyAvailable && !p.available) {
        return false;
      }
      if (filters.minRating && (p.business?.rating ?? 0) < filters.minRating) {
        return false;
      }
      return true;
    });
  },

  async getById(id: string): Promise<Product | null> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('products')
        .select('*, businesses(*)')
        .eq('id', id)
        .single();
      return (data as Product) ?? null;
    }
    const product = demoDb.getProducts().find((p) => p.id === id);
    return product ? enrichWithBusiness(product) : null;
  },

  async listByBusiness(businessId: string): Promise<Product[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      return (data as Product[]) ?? [];
    }
    return demoDb.getProducts().filter((p) => p.business_id === businessId);
  },

  async create(input: {
    business_id: string;
    name: string;
    description: string;
    price: number;
    category: ProductCategory;
    image?: string | null;
    stock: number;
    available: boolean;
  }): Promise<{ product: Product | null; error: string | null }> {
    if (!input.name.trim() || input.price < 0 || input.stock < 0) {
      return { product: null, error: 'Revisa los campos obligatorios del formulario.' };
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('products').insert(input).select().single();
      if (error) return { product: null, error: error.message };
      return { product: data as Product, error: null };
    }

    const products = demoDb.getProducts();
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      business_id: input.business_id,
      name: input.name,
      description: input.description,
      price: input.price,
      category: input.category,
      image: input.image ?? null,
      available: input.available,
      stock: input.stock,
      created_at: new Date().toISOString(),
    };
    products.unshift(newProduct);
    demoDb.saveProducts(products);
    return { product: newProduct, error: null };
  },

  async update(
    id: string,
    changes: Partial<
      Pick<Product, 'name' | 'description' | 'price' | 'category' | 'image' | 'stock' | 'available'>
    >
  ): Promise<{ error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('products').update(changes).eq('id', id);
      return { error: error ? error.message : null };
    }

    const products = demoDb.getProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return { error: 'Producto no encontrado.' };
    products[idx] = { ...products[idx], ...changes };
    demoDb.saveProducts(products);
    return { error: null };
  },

  async setAvailability(id: string, available: boolean): Promise<{ error: string | null }> {
    return this.update(id, { available });
  },
};
