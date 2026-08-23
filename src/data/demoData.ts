// ============================================================================
// DATOS DE DEMOSTRACIÓN — Universidad EAN
// ============================================================================
// Estos datos son FICTICIOS y se usan para poder explorar el MVP de UniHub
// sin necesidad de conectar credenciales reales de Supabase. Toda la app
// consulta estos datos a través de src/services (misma interfaz que usaría
// con datos reales), así que conectar Supabase no requiere tocar la UI.
// ============================================================================

import type {
  University,
  Faculty,
  Business,
  Product,
  Order,
  Profile,
  Review,
} from '../types';

export const IS_DEMO_DATA = true;

// ----------------------------------------------------------------------------
// UNIVERSITIES
// ----------------------------------------------------------------------------
export const demoUniversities: University[] = [
  {
    id: 'univ-ean',
    name: 'Universidad EAN',
    domain: 'universidadean.edu.co',
    logo: null,
    is_active: true,
  },
];

// ----------------------------------------------------------------------------
// FACULTIES
// ----------------------------------------------------------------------------
export const demoFaculties: Faculty[] = [
  { id: 'fac-ingenieria', university_id: 'univ-ean', name: 'Ingeniería' },
  { id: 'fac-administrativas', university_id: 'univ-ean', name: 'Ciencias Administrativas' },
  { id: 'fac-economicas', university_id: 'univ-ean', name: 'Ciencias Económicas' },
  { id: 'fac-humanidades', university_id: 'univ-ean', name: 'Humanidades y Ciencias Sociales' },
  { id: 'fac-postgrados', university_id: 'univ-ean', name: 'Postgrados' },
];

// ----------------------------------------------------------------------------
// PROFILES (demo)
// ----------------------------------------------------------------------------
export const demoProfiles: Profile[] = [
  {
    id: 'user-demo-buyer',
    full_name: 'Yohan Estudiante',
    email: 'yohan.demo@universidadean.edu.co',
    university_id: 'univ-ean',
    faculty_id: 'fac-economicas',
    role: 'comprador',
    created_at: '2026-02-01T10:00:00Z',
  },
  {
    id: 'owner-dulce-ean',
    full_name: 'Camila Rojas',
    email: 'camila.rojas@universidadean.edu.co',
    university_id: 'univ-ean',
    faculty_id: 'fac-administrativas',
    role: 'emprendedor',
    created_at: '2025-11-03T10:00:00Z',
  },
  {
    id: 'owner-tech-campus',
    full_name: 'Andrés Pardo',
    email: 'andres.pardo@universidadean.edu.co',
    university_id: 'univ-ean',
    faculty_id: 'fac-ingenieria',
    role: 'emprendedor',
    created_at: '2025-10-12T10:00:00Z',
  },
  {
    id: 'owner-ean-style',
    full_name: 'Laura Gómez',
    email: 'laura.gomez@universidadean.edu.co',
    university_id: 'univ-ean',
    faculty_id: 'fac-humanidades',
    role: 'emprendedor',
    created_at: '2025-09-20T10:00:00Z',
  },
  {
    id: 'owner-campus-snacks',
    full_name: 'Julián Torres',
    email: 'julian.torres@universidadean.edu.co',
    university_id: 'univ-ean',
    faculty_id: 'fac-economicas',
    role: 'emprendedor',
    created_at: '2025-12-01T10:00:00Z',
  },
  {
    id: 'owner-student-tutors',
    full_name: 'Valentina Ríos',
    email: 'valentina.rios@universidadean.edu.co',
    university_id: 'univ-ean',
    faculty_id: 'fac-postgrados',
    role: 'emprendedor',
    created_at: '2026-01-15T10:00:00Z',
  },
];

// ----------------------------------------------------------------------------
// BUSINESSES
// ----------------------------------------------------------------------------
export const demoBusinesses: Business[] = [
  {
    id: 'biz-dulce-ean',
    owner_id: 'owner-dulce-ean',
    name: 'Dulce EAN',
    description:
      'Postres y ponqués artesanales hechos por estudiantes, ideales para cumpleaños, entregas de trabajos o ese antojo de media tarde.',
    category: 'comida',
    university_id: 'univ-ean',
    faculty_id: 'fac-administrativas',
    logo: null,
    cover_image: null,
    verified: true,
    rating: 4.8,
    review_count: 32,
    created_at: '2025-11-03T10:00:00Z',
  },
  {
    id: 'biz-tech-campus',
    owner_id: 'owner-tech-campus',
    name: 'Tech Campus',
    description:
      'Accesorios y reparaciones tecnológicas para estudiantes: cables, fundas, mantenimiento de portátiles y asesoría técnica.',
    category: 'tecnologia',
    university_id: 'univ-ean',
    faculty_id: 'fac-ingenieria',
    logo: null,
    cover_image: null,
    verified: true,
    rating: 4.6,
    review_count: 21,
    created_at: '2025-10-12T10:00:00Z',
  },
  {
    id: 'biz-ean-style',
    owner_id: 'owner-ean-style',
    name: 'EAN Style',
    description:
      'Ropa y merchandising con identidad universitaria: buzos, camisetas y accesorios de diseño propio.',
    category: 'ropa',
    university_id: 'univ-ean',
    faculty_id: 'fac-humanidades',
    logo: null,
    cover_image: null,
    verified: false,
    rating: 4.3,
    review_count: 9,
    created_at: '2025-09-20T10:00:00Z',
  },
  {
    id: 'biz-campus-snacks',
    owner_id: 'owner-campus-snacks',
    name: 'Campus Snacks',
    description:
      'Snacks saludables y bebidas para llevar al salón: entrega rápida entre clases.',
    category: 'comida',
    university_id: 'univ-ean',
    faculty_id: 'fac-economicas',
    logo: null,
    cover_image: null,
    verified: true,
    rating: 4.5,
    review_count: 17,
    created_at: '2025-12-01T10:00:00Z',
  },
  {
    id: 'biz-student-tutors',
    owner_id: 'owner-student-tutors',
    name: 'Student Tutors',
    description:
      'Tutorías personalizadas en cálculo, microeconomía y programación, dictadas por estudiantes de semestres avanzados.',
    category: 'servicios',
    university_id: 'univ-ean',
    faculty_id: 'fac-postgrados',
    logo: null,
    cover_image: null,
    verified: false,
    rating: 4.9,
    review_count: 14,
    created_at: '2026-01-15T10:00:00Z',
  },
];

// ----------------------------------------------------------------------------
// PRODUCTS
// ----------------------------------------------------------------------------
export const demoProducts: Product[] = [
  // Dulce EAN
  {
    id: 'prod-torta-choco',
    business_id: 'biz-dulce-ean',
    name: 'Torta de chocolate (porción)',
    description: 'Torta húmeda de chocolate con ganache, hecha el mismo día.',
    price: 8000,
    category: 'comida',
    image: null,
    available: true,
    stock: 14,
    created_at: '2026-02-10T10:00:00Z',
  },
  {
    id: 'prod-brownie',
    business_id: 'biz-dulce-ean',
    name: 'Brownie con nueces',
    description: 'Brownie húmedo con nueces del país, unidad individual.',
    price: 5500,
    category: 'comida',
    image: null,
    available: true,
    stock: 20,
    created_at: '2026-02-11T10:00:00Z',
  },
  {
    id: 'prod-cupcakes',
    business_id: 'biz-dulce-ean',
    name: 'Caja de 6 cupcakes',
    description: 'Cupcakes de vainilla y chocolate con frosting artesanal.',
    price: 24000,
    category: 'comida',
    image: null,
    available: true,
    stock: 6,
    created_at: '2026-02-12T10:00:00Z',
  },

  // Tech Campus
  {
    id: 'prod-cable-usbc',
    business_id: 'biz-tech-campus',
    name: 'Cable USB-C reforzado 1m',
    description: 'Cable trenzado de carga rápida, resistente a dobleces.',
    price: 15000,
    category: 'tecnologia',
    image: null,
    available: true,
    stock: 25,
    created_at: '2026-01-20T10:00:00Z',
  },
  {
    id: 'prod-funda-laptop',
    business_id: 'biz-tech-campus',
    name: 'Funda para portátil 14"',
    description: 'Funda acolchada resistente al agua, varios colores.',
    price: 38000,
    category: 'tecnologia',
    image: null,
    available: true,
    stock: 10,
    created_at: '2026-01-21T10:00:00Z',
  },
  {
    id: 'prod-mantenimiento',
    business_id: 'biz-tech-campus',
    name: 'Mantenimiento de portátil',
    description: 'Limpieza interna, cambio de pasta térmica y diagnóstico.',
    price: 45000,
    category: 'servicios',
    image: null,
    available: true,
    stock: 999,
    created_at: '2026-01-22T10:00:00Z',
  },

  // EAN Style
  {
    id: 'prod-buzo-ean',
    business_id: 'biz-ean-style',
    name: 'Buzo EAN Style Classic',
    description: 'Buzo unisex 100% algodón con bordado del logo.',
    price: 68000,
    category: 'ropa',
    image: null,
    available: true,
    stock: 12,
    created_at: '2025-12-05T10:00:00Z',
  },
  {
    id: 'prod-camiseta-ean',
    business_id: 'biz-ean-style',
    name: 'Camiseta minimalista EAN',
    description: 'Camiseta 100% algodón, estampado minimalista.',
    price: 42000,
    category: 'ropa',
    image: null,
    available: true,
    stock: 18,
    created_at: '2025-12-06T10:00:00Z',
  },
  {
    id: 'prod-gorra-ean',
    business_id: 'biz-ean-style',
    name: 'Gorra bordada EAN',
    description: 'Gorra ajustable con bordado 3D.',
    price: 35000,
    category: 'accesorios',
    image: null,
    available: false,
    stock: 0,
    created_at: '2025-12-07T10:00:00Z',
  },

  // Campus Snacks
  {
    id: 'prod-mix-frutos',
    business_id: 'biz-campus-snacks',
    name: 'Mix de frutos secos (200g)',
    description: 'Almendras, maní y pasas, empacado al vacío.',
    price: 12000,
    category: 'comida',
    image: null,
    available: true,
    stock: 30,
    created_at: '2026-01-05T10:00:00Z',
  },
  {
    id: 'prod-jugo-natural',
    business_id: 'biz-campus-snacks',
    name: 'Jugo natural 500ml',
    description: 'Jugo de fruta fresca sin azúcar añadida, sabor del día.',
    price: 6000,
    category: 'comida',
    image: null,
    available: true,
    stock: 40,
    created_at: '2026-01-06T10:00:00Z',
  },

  // Student Tutors
  {
    id: 'prod-tutoria-calculo',
    business_id: 'biz-student-tutors',
    name: 'Tutoría de Cálculo (1 hora)',
    description: 'Sesión individual de refuerzo en cálculo diferencial e integral.',
    price: 30000,
    category: 'servicios',
    image: null,
    available: true,
    stock: 999,
    created_at: '2026-01-18T10:00:00Z',
  },
  {
    id: 'prod-tutoria-microeco',
    business_id: 'biz-student-tutors',
    name: 'Tutoría de Microeconomía (1 hora)',
    description: 'Refuerzo en teoría del consumidor, dualidad y producción.',
    price: 30000,
    category: 'servicios',
    image: null,
    available: true,
    stock: 999,
    created_at: '2026-01-19T10:00:00Z',
  },
  {
    id: 'prod-tutoria-programacion',
    business_id: 'biz-student-tutors',
    name: 'Tutoría de Programación (1 hora)',
    description: 'Apoyo en lógica de programación y estructuras de datos.',
    price: 30000,
    category: 'servicios',
    image: null,
    available: true,
    stock: 999,
    created_at: '2026-01-20T10:00:00Z',
  },
];

// ----------------------------------------------------------------------------
// ORDERS (demo, asociados al comprador demo)
// ----------------------------------------------------------------------------
export const demoOrders: Order[] = [
  {
    id: 'order-1',
    buyer_id: 'user-demo-buyer',
    business_id: 'biz-dulce-ean',
    total: 16000,
    status: 'completado',
    created_at: '2026-08-10T14:30:00Z',
    items: [
      {
        id: 'item-1',
        order_id: 'order-1',
        product_id: 'prod-torta-choco',
        quantity: 2,
        unit_price: 8000,
      },
    ],
  },
  {
    id: 'order-2',
    buyer_id: 'user-demo-buyer',
    business_id: 'biz-campus-snacks',
    total: 18000,
    status: 'en_preparacion',
    created_at: '2026-08-19T09:15:00Z',
    items: [
      {
        id: 'item-2',
        order_id: 'order-2',
        product_id: 'prod-jugo-natural',
        quantity: 3,
        unit_price: 6000,
      },
    ],
  },
  {
    id: 'order-3',
    buyer_id: 'user-demo-buyer',
    business_id: 'biz-tech-campus',
    total: 15000,
    status: 'pendiente',
    created_at: '2026-08-21T18:00:00Z',
    items: [
      {
        id: 'item-3',
        order_id: 'order-3',
        product_id: 'prod-cable-usbc',
        quantity: 1,
        unit_price: 15000,
      },
    ],
  },
];

// ----------------------------------------------------------------------------
// REVIEWS (demo)
// ----------------------------------------------------------------------------
export const demoReviews: Review[] = [
  {
    id: 'review-1',
    order_id: 'order-1',
    buyer_id: 'user-demo-buyer',
    business_id: 'biz-dulce-ean',
    rating: 5,
    comment: '¡Buenísima la torta! Llegó a tiempo y súper fresca.',
    created_at: '2026-08-11T10:00:00Z',
    buyer_name: 'Yohan Estudiante',
  },
];
