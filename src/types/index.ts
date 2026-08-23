// ============================================================================
// UNIHUB — TIPOS DEL MODELO DE DATOS
// Reflejan 1:1 el schema de Supabase (supabase/schema.sql)
// ============================================================================

export type UserRole = 'comprador' | 'emprendedor';

export type OrderStatus =
  | 'pendiente'
  | 'confirmado'
  | 'en_preparacion'
  | 'completado'
  | 'cancelado';

export type ProductCategory =
  | 'comida'
  | 'ropa'
  | 'tecnologia'
  | 'accesorios'
  | 'servicios'
  | 'otros';

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  comida: 'Comida',
  ropa: 'Ropa',
  tecnologia: 'Tecnología',
  accesorios: 'Accesorios',
  servicios: 'Servicios',
  otros: 'Otros',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  en_preparacion: 'En preparación',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'pendiente',
  'confirmado',
  'en_preparacion',
  'completado',
];

export interface University {
  id: string;
  name: string;
  domain: string;
  logo: string | null;
  is_active: boolean;
}

export interface Faculty {
  id: string;
  university_id: string;
  name: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  university_id: string;
  faculty_id: string;
  role: UserRole;
  created_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  category: ProductCategory;
  university_id: string;
  faculty_id: string;
  logo: string | null;
  cover_image: string | null;
  verified: boolean;
  rating: number;
  created_at: string;
  // campos derivados (joins), opcionales para la UI
  university_name?: string;
  faculty_name?: string;
  review_count?: number;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  image: string | null;
  available: boolean;
  stock: number;
  created_at: string;
  // campos derivados (joins), opcionales para la UI
  business?: Business;
}

export interface Order {
  id: string;
  buyer_id: string;
  business_id: string;
  total: number;
  status: OrderStatus;
  created_at: string;
  // campos derivados
  business?: Business;
  buyer?: Profile;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: Product;
}

export interface Review {
  id: string;
  order_id: string;
  buyer_id: string;
  business_id: string;
  rating: number;
  comment: string;
  created_at: string;
  buyer_name?: string;
}
