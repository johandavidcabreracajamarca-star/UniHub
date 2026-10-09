import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { BrandMark } from './BrandMark';

// Android/Chrome avisa que la app se puede instalar con este evento. Lo
// escuchamos apenas carga el código, porque puede llegar antes de que el
// banner aparezca en pantalla.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((fn) => fn());
  });
}

const DISMISS_KEY = 'unihub:install-dismissed';

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/** Invita a agregar UniHub a la pantalla de inicio del celular. */
export function InstallBanner() {
  const [canPrompt, setCanPrompt] = useState(Boolean(deferredPrompt));
  const [hidden, setHidden] = useState(() => isStandalone() || wasDismissed());
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    const update = () => setCanPrompt(Boolean(deferredPrompt));
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  const ios = isIOS();
  if (hidden || (!canPrompt && !ios)) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignorar
    }
    setHidden(true);
  };

  const install = async () => {
    if (ios) {
      setShowIOSHelp((v) => !v);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (outcome === 'accepted') setHidden(true);
    else setCanPrompt(false);
  };

  return (
    <div className="mx-4 mt-5 rounded-card border border-primary/15 bg-primary-light p-3.5 md:hidden">
      <div className="flex items-center gap-3">
        <BrandMark size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Instala UniHub</p>
          <p className="text-xs text-ink/60">Ábrela desde tu pantalla de inicio, como cualquier app.</p>
        </div>
        <button
          onClick={install}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-white"
        >
          <Download size={14} />
          Instalar
        </button>
        <button onClick={dismiss} aria-label="Cerrar" className="shrink-0 p-1 text-ink/40">
          <X size={16} />
        </button>
      </div>
      {showIOSHelp && (
        <p className="mt-3 flex flex-wrap items-center gap-1 rounded-control bg-white px-3 py-2.5 text-xs text-ink/70">
          En Safari, toca <Share size={13} className="inline text-primary" /> <b>Compartir</b> y luego
          <b>“Agregar a pantalla de inicio”</b>.
        </p>
      )}
    </div>
  );
}
