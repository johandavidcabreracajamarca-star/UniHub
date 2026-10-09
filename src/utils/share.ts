// ============================================================================
// COMPARTIR
// ============================================================================
// En el celular usamos el menú nativo de compartir (WhatsApp, Instagram,
// Telegram…). Si el navegador no lo soporta (la mayoría de computadores),
// abrimos WhatsApp Web con el mensaje ya escrito.
// ============================================================================

export type ShareResult = 'shared' | 'whatsapp' | 'cancelled';

export async function shareLink({ title, text, path }: { title: string; text: string; path: string }): Promise<ShareResult> {
  const url = `${window.location.origin}${path}`;

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err) {
      // El usuario cerró el menú: no hacemos nada más
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
    }
  }

  const message = encodeURIComponent(`${text}\n${url}`);
  window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener');
  return 'whatsapp';
}
