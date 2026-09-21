import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Profile, University, UserRole } from '../types';
import { demoProfiles } from '../data/demoData';

const DEMO_SESSION_KEY = 'unihub_demo_session';
const DEMO_USERS_KEY = 'unihub_demo_users'; // { [email]: { password, profile } }

interface RegisterInput {
  full_name: string;
  email: string;
  password: string;
  university: University;
  faculty_id: string;
  role: UserRole;
}

interface RegisterResult {
  error: string | null;
  // true cuando Supabase creó la cuenta pero exige confirmar el correo antes
  // de poder iniciar sesión (no hay sesión activa todavía).
  needsConfirmation: boolean;
}

interface LoginResult {
  error: string | null;
  // true cuando el error es "correo sin confirmar" (para ofrecer reenviar).
  unconfirmed: boolean;
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
  async register(input: RegisterInput): Promise<RegisterResult> {
    const { university } = input;

    if (!validateInstitutionalEmail(input.email, university.domain)) {
      return {
        error: `Usa tu correo institucional (@${university.domain}).`,
        needsConfirmation: false,
      };
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: input.full_name,
            university_id: university.id,
            faculty_id: input.faculty_id,
            role: input.role,
          },
        },
      });
      if (error) return { error: error.message, needsConfirmation: false };
      if (!data.user) {
        return { error: 'No se pudo crear la cuenta.', needsConfirmation: false };
      }

      // Si el correo ya tenía una cuenta confirmada, Supabase no da error
      // (por seguridad) pero devuelve un usuario sin identidades.
      if (data.user.identities && data.user.identities.length === 0) {
        return {
          error: 'Ya existe una cuenta con este correo. Inicia sesión.',
          needsConfirmation: false,
        };
      }

      // El perfil se crea solo, con un trigger en la base de datos
      // (ver public.handle_new_user en supabase/schema.sql) a partir
      // de los metadatos enviados arriba.
      //
      // Con "Confirm email" activo en Supabase, signUp no devuelve sesión
      // hasta que la persona abre el enlace del correo.
      return { error: null, needsConfirmation: !data.session };
    }

    // Demo mode
    const users = getDemoUsers();
    if (users[input.email]) {
      return { error: 'Ya existe una cuenta con este correo.', needsConfirmation: false };
    }
    const profile: Profile = {
      id: `user-${Date.now()}`,
      full_name: input.full_name,
      email: input.email,
      university_id: university.id,
      faculty_id: input.faculty_id,
      role: input.role,
      created_at: new Date().toISOString(),
    };
    users[input.email] = { password: input.password, profile };
    saveDemoUsers(users);
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(profile));
    return { error: null, needsConfirmation: false };
  },

  async login(email: string, password: string): Promise<LoginResult> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) return { error: null, unconfirmed: false };

      const msg = error.message.toLowerCase();
      if (msg.includes('not confirmed')) {
        return {
          error: 'Aún no has confirmado tu correo. Abre el enlace que te enviamos (revisa también spam o no deseados).',
          unconfirmed: true,
        };
      }
      if (msg.includes('invalid login credentials')) {
        return { error: 'Correo o contraseña incorrectos.', unconfirmed: false };
      }
      return { error: error.message, unconfirmed: false };
    }

    // Demo mode
    const users = getDemoUsers();
    const record = users[email];
    if (!record || record.password !== password) {
      return { error: 'Correo o contraseña incorrectos.', unconfirmed: false };
    }
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(record.profile));
    return { error: null, unconfirmed: false };
  },

  // Reenvía el correo de confirmación de registro.
  async resendConfirmation(email: string): Promise<{ error: string | null }> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      return { error: error ? error.message : null };
    }
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
