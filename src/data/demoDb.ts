// ============================================================================
// DEMO DB — persiste en localStorage los cambios hechos durante la sesión
// (nuevos productos, emprendimientos, pedidos, reseñas) por encima de los
// datos semilla de demoData.ts. Simula el comportamiento de Supabase para
// que el MVP sea completamente funcional sin backend real.
// ============================================================================

import type {
  Business,
  Product,
  Order,
  Review,
  Notification,
  Conversation,
  Message,
} from '../types';
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
  notifications: 'unihub_demo_notifications',
  favorites: 'unihub_demo_favorites',
  conversations: 'unihub_demo_conversations',
  messages: 'unihub_demo_messages',
};

interface FavoriteRow {
  user_id: string;
  business_id: string;
  created_at: string;
}

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
  getNotifications(): Notification[] {
    return load(KEYS.notifications, []);
  },
  saveNotifications(items: Notification[]) {
    save(KEYS.notifications, items);
  },
  getFavoritesRaw(): FavoriteRow[] {
    return load(KEYS.favorites, []);
  },
  saveFavoritesRaw(items: FavoriteRow[]) {
    save(KEYS.favorites, items);
  },
  getFavoriteIds(userId: string): string[] {
    return demoDb
      .getFavoritesRaw()
      .filter((f) => f.user_id === userId)
      .map((f) => f.business_id);
  },
  getFavoriteBusinesses(userId: string): Business[] {
    const ids = demoDb.getFavoriteIds(userId);
    return demoDb.getBusinesses().filter((b) => ids.includes(b.id));
  },
  addFavorite(userId: string, businessId: string) {
    const rows = demoDb.getFavoritesRaw();
    if (rows.some((f) => f.user_id === userId && f.business_id === businessId)) return;
    rows.push({ user_id: userId, business_id: businessId, created_at: new Date().toISOString() });
    demoDb.saveFavoritesRaw(rows);
  },
  removeFavorite(userId: string, businessId: string) {
    const rows = demoDb
      .getFavoritesRaw()
      .filter((f) => !(f.user_id === userId && f.business_id === businessId));
    demoDb.saveFavoritesRaw(rows);
  },
  getConversations(): Conversation[] {
    return load(KEYS.conversations, []);
  },
  saveConversations(items: Conversation[]) {
    save(KEYS.conversations, items);
  },
  getMessages(): Message[] {
    return load(KEYS.messages, []);
  },
  saveMessages(items: Message[]) {
    save(KEYS.messages, items);
  },
};
