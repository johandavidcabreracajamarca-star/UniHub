import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { University, Faculty } from '../types';
import { demoUniversities, demoFaculties } from '../data/demoData';

export const universityService = {
  async listUniversities(): Promise<University[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('universities')
        .select('*')
        .eq('is_active', true);
      return (data as University[]) ?? [];
    }
    return demoUniversities;
  },

  async listFaculties(universityId: string): Promise<Faculty[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('faculties')
        .select('*')
        .eq('university_id', universityId);
      return (data as Faculty[]) ?? [];
    }
    return demoFaculties.filter((f) => f.university_id === universityId);
  },
};
