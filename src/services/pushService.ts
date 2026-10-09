import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// ============================================================================
// AVISOS AL CELULAR (Web Push)
// ============================================================================
// Pide permiso, registra este celular/navegador y guarda la suscripción en
// Supabase (tabla push_subscriptions). La función send-push usa esa
// suscripción para avisar de pedidos y mensajes aunque la app esté cerrada.
//
// En iPhone solo funciona si UniHub está instalada en la pantalla de inicio
// (iOS 16.4 o superior); Safari normal no permite avisos.
// ============================================================================

// Llave pública: es pública por diseño, puede vivir en el código. La privada
// solo existe en los secretos de Supabase.
const VAPID_PUBLIC_KEY = 'BAAb75sIxycugv6hIeo1TXgHI_cxpfP6U29gWyWK1XC5RN4pCzTCXEV3I5QHRZ7VuD7_OLdWnpYqU16fJj5zJ58';

export type PushStatus = 'unsupported' | 'needs-install' | 'denied' | 'enabled' | 'disabled';

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

async function getRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.ready);
}

// Registro del service worker sin esperar a que exista (para tareas de fondo
// que no deben quedarse colgadas si la app corre sin service worker).
async function existingRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration()) ?? null;
}

// Guarda la suscripción a nombre de quien tiene la sesión abierta. Usa la
// función save_push_subscription (supabase/migrations/20261009_avisos_ventas.sql),
// que también reasigna el celular si antes lo usaba otra cuenta; si esa
// función aún no existe, hace el guardado simple.
async function saveSubscription(sub: PushSubscription) {
  const json = sub.toJSON();
  const params = { p_endpoint: json.endpoint, p_p256dh: json.keys?.p256dh, p_auth: json.keys?.auth };
  const { error } = await supabase!.rpc('save_push_subscription', params);
  if (!error || error.code !== 'PGRST202') return { error };
  return supabase!
    .from('push_subscriptions')
    .upsert({ endpoint: json.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth }, { onConflict: 'endpoint' });
}

export const pushService = {
  async getStatus(): Promise<PushStatus> {
    if (!isSupabaseConfigured) return 'unsupported';
    if (isIOS() && !isStandalone()) return 'needs-install';
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      return 'unsupported';
    }
    if (Notification.permission === 'denied') return 'denied';
    const reg = await getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    return sub && Notification.permission === 'granted' ? 'enabled' : 'disabled';
  },

  async enable(): Promise<{ status: PushStatus; error: string | null }> {
    const current = await pushService.getStatus();
    if (current === 'unsupported' || current === 'needs-install') return { status: current, error: null };

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { status: permission === 'denied' ? 'denied' : 'disabled', error: null };

    const reg = await getRegistration();
    if (!reg) return { status: 'unsupported', error: null };

    try {
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));
      const { error } = await saveSubscription(sub);
      if (error) {
        console.error('push_subscriptions:', error);
        return { status: 'disabled', error: `No se pudieron activar los avisos (${error.message}).` };
      }
      return { status: 'enabled', error: null };
    } catch (err) {
      const detail = err instanceof Error ? ` (${err.message})` : '';
      return { status: 'disabled', error: `Tu navegador no permitió activar los avisos${detail}.` };
    }
  },

  async disable(): Promise<PushStatus> {
    const reg = await getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await supabase?.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    }
    return 'disabled';
  },

  /**
   * Al iniciar sesión: si este celular ya tenía los avisos activados, los deja
   * a nombre de la cuenta que acaba de entrar.
   */
  async syncThisDevice(): Promise<void> {
    if (!isSupabaseConfigured || !('Notification' in window) || Notification.permission !== 'granted') return;
    const sub = await (await existingRegistration())?.pushManager.getSubscription();
    if (sub) await saveSubscription(sub);
  },

  /**
   * Al cerrar sesión: este celular deja de recibir los avisos de esa cuenta
   * (así, si alguien más usa el celular, no le llegan avisos ajenos).
   */
  async forgetThisDevice(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    const sub = await (await existingRegistration())?.pushManager.getSubscription();
    if (sub) await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  },
};
