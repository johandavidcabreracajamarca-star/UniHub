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
      const json = sub.toJSON();
      const { error } = await supabase!.from('push_subscriptions').upsert(
        { endpoint: json.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth },
        { onConflict: 'endpoint' }
      );
      if (error) return { status: 'disabled', error: 'No se pudieron activar los avisos. Intenta de nuevo.' };
      return { status: 'enabled', error: null };
    } catch {
      return { status: 'disabled', error: 'Tu navegador no permitió activar los avisos.' };
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
};
