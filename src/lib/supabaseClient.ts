import { createClient } from '@supabase/supabase-js';

// Las credenciales NUNCA se colocan directamente en el código.
// Se leen desde variables de entorno (.env, ver .env.example).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

// Bandera global: true cuando hay credenciales reales de Supabase configuradas.
// Cuando es false, la app funciona con datos de demostración locales
// (src/data/demoData.ts) para que el MVP sea explorable sin backend.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;
