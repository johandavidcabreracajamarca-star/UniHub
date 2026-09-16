// ============================================================================
// PREFERENCIA DE NOTIFICACIONES — silenciar notificaciones en este
// dispositivo/navegador. Es una preferencia local (no se sincroniza entre
// dispositivos), suficiente para el MVP.
// ============================================================================

const KEY = 'unihub_notifications_muted';

export function areNotificationsMuted(): boolean {
  return localStorage.getItem(KEY) === '1';
}

export function setNotificationsMuted(muted: boolean) {
  if (muted) {
    localStorage.setItem(KEY, '1');
  } else {
    localStorage.removeItem(KEY);
  }
}
