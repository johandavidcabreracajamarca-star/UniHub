// Recuerda a qué página quería entrar alguien antes de que le pidiéramos
// iniciar sesión (por ejemplo, un producto que le compartieron por WhatsApp),
// para llevarlo ahí apenas entre o cree su cuenta.

const KEY = 'unihub:redirect-after-login';

export function rememberRedirect(path: string) {
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // sin almacenamiento disponible: simplemente iremos a /explore
  }
}

export function consumeRedirect(fallback = '/explore'): string {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    // solo rutas internas, nunca una URL externa
    if (path && path.startsWith('/') && !path.startsWith('//')) return path;
  } catch {
    // ignorar
  }
  return fallback;
}
