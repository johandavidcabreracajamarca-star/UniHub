// ============================================================================
// DEMO DB — persiste en localStorage los cambios hechos durante la sesión
// (nuevos productos, emprendimientos, pedidos, reseñas) por encima de los
// datos semilla de demoData.ts. Simula el comportamiento de Supabase para
// que el MVP sea completamente funcional sin backend real.
// ============================================================================

import type { Business, Product, Order, Review } from '../types';
import {
  demoBusinesses,
  demoProducts,
  demoOrders,
  demoReviews,
} from './demoData';

const KEYS = {
  businesses: 'unihub_demo_businesses',
  products: 'unihub_demo_products',
  orders: 'unihub_demo_orders',
  reviews: 'unihub_demo_reviews',
};

function load<T>(key: string, seed: T[]): T[] {
  const raw = localStorage.getItem(key);
  if (raw) return JSON.parse(raw) as T[];
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
}

function save<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

export const demoDb = {
  getBusinesses(): Business[] {
    return load(KEYS.businesses, demoBusinesses);
  },
  saveBusinesses(items: Business[]) {
    save(KEYS.businesses, items);
  },
  getProducts(): Product[] {
    return load(KEYS.products, demoProducts);
  },
  saveProducts(items: Product[]) {
    save(KEYS.products, items);
  },
  getOrders(): Order[] {
    return load(KEYS.orders, demoOrders);
  },
  saveOrders(items: Order[]) {
    save(KEYS.orders, items);
  },
  getReviews(): Review[] {
    return load(KEYS.reviews, demoReviews);
  },
  saveReviews(items: Review[]) {
    save(KEYS.reviews, items);
  },
};
