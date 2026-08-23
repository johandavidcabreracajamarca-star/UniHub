import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Profile, UserRole } from '../types';
import { demoProfiles, demoUniversities } from '../data/demoData';

const DEMO_SESSION_KEY = 'unihub_demo_session';
const DEMO_USERS_KEY = 'unihub_demo_users'; // { [email]: { password, profile } }

interface RegisterInput {
  full_name: string;
  email: string;
  password: string;
  university_id: string;
  faculty_id: string;
  role: UserRole;
}

// ----------------------------------------------------------------------------
// MODO DEMO — persistencia en localStorage, sin backend real
// ----------------------------------------------------------------------------
function getDemoUsers(): Record<string, { password: string; profile: Profile }> {
  const raw = localStorage.getItem(DEMO_USERS_KEY);
  const stored = raw ? JSON.parse(raw) : {};
  // Sembrar el comprador demo por defecto para poder iniciar sesión rápido
  if (!stored['yohan.demo@universidadean.edu.co']) {
    stored['yohan.demo@universidadean.edu.co'] = {
      password: 'demo1234',
      profile: demoProfiles[0],
    };
  }
  return stored;
}

function saveDemoUsers(users: Record<string, { password: string; profile: Profile }>) {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
}

function validateInstitutionalEmail(email: string, domain: string) {
  return email.toLowerCase().endsWith('@' + domain.toLowerCase());
}

export const authService = {
  async register(input: RegisterInput): Promise<{ error: string | null }> {
    const university = demoUniversities.find((u) => u.id === input.university_id);
    if (!university) return { error: 'Universidad no válida.' };

    if (!validateInstitutionalEmail(input.email, university.domain)) {
      return {
        error: `Usa tu correo institucional (@${university.domain}).`,
      };
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
      });
      if (error) return { error: error.message };
      if (!data.user) return { error: 'No se pudo crear la cuenta.' };

      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: input.full_name,
        email: input.email,
        university_id: input.university_id,
        faculty_id: input.faculty_id,
        role: input.role,
      });
      if (profileError) return { error: profileError.message };
      return { error: null };
    }

    // Demo mode
    const users = getDemoUsers();
    if (users[input.email]) {
      return { error: 'Ya existe una cuenta con este correo.' };
    }
    const profile: Profile = {
      id: `user-${Date.now()}`,
      full_name: input.full_name,
      email: input.email,
      university_id: input.university_id,
      faculty_id: input.faculty_id,
      role: input.role,
      created_at: new Date().toISOString(),
    };
    users[input.email] = { password: input.password, profile };
    saveDemoUsers(users);
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(profile));
    return { error: null };
  },

  async login(email: string, password: string): Promise<{ error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? error.message : null };
    }

    // Demo mode
    const users = getDemoUsers();
    const record = users[email];
    if (!record || record.password !== password) {
      return { error: 'Correo o contraseña incorrectos.' };
    }
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(record.profile));
    return { error: null };
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
      return;
    }
    localStorage.removeItem(DEMO_SESSION_KEY);
  },

  async requestPasswordReset(email: string): Promise<{ error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error: error ? error.message : null };
    }
    // Demo mode: siempre "éxito" simulado
    return { error: null };
  },

  async getCurrentProfile(): Promise<Profile | null> {
    if (isSupabaseConfigured && supabase) {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      return (data as Profile) ?? null;
    }

    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  },
};
