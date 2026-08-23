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

export const businessService = {
  async listAll(): Promise<Business[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('businesses')
        .select('*, universities(name), faculties(name)')
        .order('created_at', { ascending: false });
      return (data as Business[]) ?? [];
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
      return (data as Business) ?? null;
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
      verified: false, // el usuario nunca puede fijar esto directamente
      rating: 0,
      review_count: 0,
      created_at: new Date().toISOString(),
    };
    businesses.unshift(newBusiness);
    demoDb.saveBusinesses(businesses);
    return { business: enrich(newBusiness), error: null };
  },
};
