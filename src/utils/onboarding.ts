// La bienvenida guiada se muestra una sola vez por dispositivo.

const STORAGE_KEY = 'unihub:onboarding-done';

export function onboardingSeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return true;
  }
}

export function markOnboardingSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // ignorar
  }
}
