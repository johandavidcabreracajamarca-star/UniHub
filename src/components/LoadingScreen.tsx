/**
 * Pantalla de carga reutilizable, con el mismo look del splash estático de
 * index.html, para que la transición entre "abrir la app" y "ya sabemos si
 * hay sesión" se sienta como una sola pantalla y no como un parpadeo.
 */
export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface">
      <img
        src="/icon-192.png"
        alt="UniHub"
        className="h-20 w-20 rounded-2xl shadow-card-hover animate-pulse"
      />
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
