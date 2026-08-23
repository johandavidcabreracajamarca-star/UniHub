# UniHub

**Conectando ideas, impulsando emprendimientos.**

El marketplace de confianza de la comunidad universitaria. MVP inicial para
**Universidad EAN**, construido con una arquitectura que permite incorporar
otras universidades sin reconstruir el sistema (`University → Faculty →
User/Business → Product`).

---

## Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS + React Router + Lucide Icons.
- **Backend:** Supabase (Auth + PostgreSQL + Row Level Security).
- Arquitectura mobile-first, responsive (mobile / tablet / desktop).

---

## Empezar en 2 minutos (modo demo, sin Supabase)

El proyecto **funciona completamente sin configurar Supabase**. Si no defines
credenciales, UniHub usa datos de demostración de Universidad EAN
(`src/data/demoData.ts`) persistidos en `localStorage`, lo que permite probar
todo el flujo: registro, login, explorar, comprar, pedidos, dashboard de
emprendedor, etc.

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Para iniciar sesión rápido en modo demo:

- **Correo:** `yohan.demo@universidadean.edu.co`
- **Contraseña:** `demo1234`

O simplemente crea una cuenta nueva desde "Crear cuenta" (debes usar un correo
que termine en `@universidadean.edu.co`).

---

## Conectar Supabase real (producción)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor** y ejecuta el contenido completo de
   [`supabase/schema.sql`](./supabase/schema.sql). Esto crea todas las tablas,
   relaciones, triggers y políticas de **Row Level Security**, además de
   sembrar Universidad EAN y sus facultades.
3. Copia `.env.example` a `.env` y completa tus credenciales (Project
   Settings → API en el dashboard de Supabase):

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
   ```

4. Reinicia `npm run dev`. La app detecta automáticamente las credenciales y
   deja de usar datos demo — todos los servicios (`src/services/*`) ya están
   escritos contra la API real de Supabase.
5. (Opcional) Para poblar datos de demostración reales, registra usuarios
   emprendedores desde el flujo normal de la app y crea sus emprendimientos
   con el mismo contenido de `src/data/demoData.ts`.

> **Nota:** el campo `verified` de `businesses` sólo puede modificarse desde
> el backend (por ejemplo, actualizando la fila directamente en el dashboard
> de Supabase o con una función administrativa). Ningún usuario puede
> auto-verificarse: esto está garantizado por la política de RLS en
> `businesses_update_own`.

---

## Estructura del proyecto

```
src/
  components/     # Componentes reutilizables (cards, botones, estados, nav)
  pages/          # Páginas / rutas de la aplicación
  pages/dashboard/# Sub-páginas del dashboard del emprendedor
  hooks/          # useAuth, useToast, useMyBusiness
  services/       # Capa de datos: funciona con Supabase real o modo demo
  lib/            # Cliente de Supabase
  data/           # Datos y persistencia de demostración
  types/          # Tipos TypeScript del modelo de datos
supabase/
  schema.sql      # Schema completo: tablas, relaciones, RLS, triggers, seed
```

### Por qué esta arquitectura

Cada servicio en `src/services/` expone la misma interfaz sin importar si hay
credenciales de Supabase configuradas (`isSupabaseConfigured`). Esto significa
que la UI **nunca sabe ni le importa** de dónde vienen los datos — conectar un
backend real es sólo cuestión de variables de entorno, no de reescribir
componentes.

---

## Rutas

| Ruta | Descripción | Acceso |
|---|---|---|
| `/` | Bienvenida | Público |
| `/login` | Inicio de sesión | Público |
| `/register` | Registro | Público |
| `/forgot-password` | Recuperar contraseña | Público |
| `/explore` | Home / explorar productos | Autenticado |
| `/search` | Búsqueda con filtros | Autenticado |
| `/product/:id` | Detalle de producto + compra | Autenticado |
| `/business/:id` | Perfil de emprendimiento | Autenticado |
| `/orders` | Mis pedidos + reseñas | Autenticado |
| `/profile` | Perfil de usuario | Autenticado |
| `/dashboard` | Resumen del emprendedor | Rol: emprendedor |
| `/dashboard/products` | Mis productos | Rol: emprendedor |
| `/dashboard/products/new` | Crear producto | Rol: emprendedor |
| `/dashboard/products/:id/edit` | Editar producto | Rol: emprendedor |
| `/dashboard/orders` | Pedidos recibidos | Rol: emprendedor |

---

## Prioridades del MVP (según especificación)

- **P0 — Core:** autenticación, home, productos, detalle, perfiles de
  emprendimiento, flujo de compra, pedidos, dashboard del emprendedor. ✅
- **P1:** búsqueda, filtros, reseñas, verificación. ✅
- **P2 (fuera de alcance de este MVP):** múltiples universidades, analítica
  avanzada, funcionalidades adicionales de marketplace.

Este MVP no implementa pasarela de pago: el objetivo es validar la
interacción de compra dentro de la comunidad universitaria.
