import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Business, ProductCategory } from '../types';
import { demoDb } from '../data/demoDb';
import { demoUniversities, demoFaculties } from '../data/demoData';

function enrich(business: Business): Business {
  const university = demoUniversities.find((u) => u.id === business.university_id);
  const faculty = demoFaculties.find((f) => f.id === business.faculty_id);
  return {
    ...business,
    university_name: university?.name,
    faculty_name: faculty?.name,
  };
}

interface BusinessRow extends Business {
  universities?: { name: string } | null;
  faculties?: { name: string } | null;
}

// Supabase devuelve los joins embebidos bajo el nombre de la tabla
// (universities / faculties), no como los campos planos university_name /
// faculty_name que espera el resto de la app. Esta función los aplana.
function mapBusinessRow(row: BusinessRow): Business {
  const { universities, faculties, ...rest } = row;
  return {
    ...rest,
    university_name: universities?.name,
    faculty_name: faculties?.name,
  };
}

export const businessService = {
  async listAll(): Promise<Business[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('businesses')
        .select('*, universities(name), faculties(name)')
        .order('created_at', { ascending: false });
      return ((data as BusinessRow[]) ?? []).map(mapBusinessRow);
    }
    return demoDb.getBusinesses().map(enrich);
  },

  async listVerified(): Promise<Business[]> {
    const all = await this.listAll();
    return all.filter((b) => b.verified);
  },

  async getById(id: string): Promise<Business | null> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('businesses')
        .select('*, universities(name), faculties(name)')
        .eq('id', id)
        .single();
      return data ? mapBusinessRow(data as BusinessRow) : null;
    }
    const business = demoDb.getBusinesses().find((b) => b.id === id);
    return business ? enrich(business) : null;
  },

  async getByOwner(ownerId: string): Promise<Business | null> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', ownerId)
        .maybeSingle();
      return (data as Business) ?? null;
    }
    const business = demoDb.getBusinesses().find((b) => b.owner_id === ownerId);
    return business ? enrich(business) : null;
  },

  async create(input: {
    owner_id: string;
    name: string;
    description: string;
    category: ProductCategory;
    university_id: string;
    faculty_id: string;
    logo?: string | null;
    cover_image?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }): Promise<{ business: Business | null; error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('businesses')
        .insert({ ...input, verified: false, rating: 0 })
        .select()
        .single();
      if (error) return { business: null, error: error.message };
      return { business: data as Business, error: null };
    }

    const businesses = demoDb.getBusinesses();
    if (businesses.some((b) => b.owner_id === input.owner_id)) {
      return { business: null, error: 'Ya tienes un emprendimiento registrado.' };
    }
    const newBusiness: Business = {
      id: `biz-${Date.now()}`,
      owner_id: input.owner_id,
      name: input.name,
      description: input.description,
      category: input.category,
      university_id: input.university_id,
      faculty_id: input.faculty_id,
      logo: input.logo ?? null,
      cover_image: input.cover_image ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      verified: false, // el usuario nunca puede fijar esto directamente
      rating: 0,
      review_count: 0,
      created_at: new Date().toISOString(),
    };
    businesses.unshift(newBusiness);
    demoDb.saveBusinesses(businesses);
    return { business: enrich(newBusiness), error: null };
  },

  // El propio dueño puede cambiar su logo cuando quiera (por ejemplo si
  // creó su emprendimiento antes de que existiera esta opción).
  async updateLogo(id: string, logo: string | null): Promise<{ error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('businesses').update({ logo }).eq('id', id);
      return { error: error ? error.message : null };
    }
    const businesses = demoDb.getBusinesses();
    const idx = businesses.findIndex((b) => b.id === id);
    if (idx === -1) return { error: 'Emprendimiento no encontrado.' };
    businesses[idx] = { ...businesses[idx], logo };
    demoDb.saveBusinesses(businesses);
    return { error: null };
  },

  // El propio dueño puede llamar esto en cualquier momento (crear o
  // actualizar su ubicación) — la política businesses_update_own ya
  // permite que el dueño actualice su fila, así que no hace falta ninguna
  // política nueva en Supabase.
  async updateLocation(
    id: string,
    latitude: number,
    longitude: number
  ): Promise<{ error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('businesses')
        .update({ latitude, longitude })
        .eq('id', id);
      return { error: error ? error.message : null };
    }
    const businesses = demoDb.getBusinesses();
    const idx = businesses.findIndex((b) => b.id === id);
    if (idx === -1) return { error: 'Emprendimiento no encontrado.' };
    businesses[idx] = { ...businesses[idx], latitude, longitude };
    demoDb.saveBusinesses(businesses);
    return { error: null };
  },

  // El propio dueño prende/apaga "disponible ahora" y edita su nota de
  // horario cuando quiera — igual que logo/ubicación, cubierto por
  // businesses_update_own sin política nueva.
  async updateAvailability(
    id: string,
    availableNow: boolean,
    availabilityNote: string | null
  ): Promise<{ error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('businesses')
        .update({ available_now: availableNow, availability_note: availabilityNote })
        .eq('id', id);
      return { error: error ? error.message : null };
    }
    const businesses = demoDb.getBusinesses();
    const idx = businesses.findIndex((b) => b.id === id);
    if (idx === -1) return { error: 'Emprendimiento no encontrado.' };
    businesses[idx] = {
      ...businesses[idx],
      available_now: availableNow,
      availability_note: availabilityNote,
    };
    demoDb.saveBusinesses(businesses);
    return { error: null };
  },

  // Las dos funciones siguientes solo las puede ejecutar con éxito un admin:
  // la política de seguridad en Supabase (businesses_update_admin) rechaza
  // el cambio si quien lo intenta no tiene role = 'admin' en su perfil.
  async setVerified(id: string, verified: boolean): Promise<{ error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('businesses').update({ verified }).eq('id', id);
      return { error: error ? error.message : null };
    }
    const businesses = demoDb.getBusinesses();
    const idx = businesses.findIndex((b) => b.id === id);
    if (idx === -1) return { error: 'Emprendimiento no encontrado.' };
    businesses[idx] = { ...businesses[idx], verified };
    demoDb.saveBusinesses(businesses);
    return { error: null };
  },

  async setSuspended(id: string, suspended: boolean): Promise<{ error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('businesses').update({ suspended }).eq('id', id);
      return { error: error ? error.message : null };
    }
    const businesses = demoDb.getBusinesses();
    const idx = businesses.findIndex((b) => b.id === id);
    if (idx === -1) return { error: 'Emprendimiento no encontrado.' };
    businesses[idx] = { ...businesses[idx], suspended };
    demoDb.saveBusinesses(businesses);
    return { error: null };
  },
};
