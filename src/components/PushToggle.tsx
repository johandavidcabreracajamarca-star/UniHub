import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { pushService, type PushStatus } from '../services/pushService';

const STATUS_TEXT: Record<PushStatus, string> = {
  enabled: 'Activados en este celular',
  disabled: 'Te avisamos de pedidos y mensajes aunque la app esté cerrada',
  denied: 'Bloqueaste los avisos. Actívalos en los ajustes del navegador para UniHub.',
  'needs-install': 'En iPhone, primero instala UniHub en tu pantalla de inicio',
  unsupported: 'Este navegador no permite avisos',
};

/**
 * Activa/desactiva los avisos push en este dispositivo.
 * variant "card": tarjeta llamativa (panel del emprendedor), solo si aún no están activos.
 */
export function PushToggle({ variant = 'row' }: { variant?: 'row' | 'card' }) {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pushService.getStatus().then(setStatus).catch(() => setStatus('unsupported'));
  }, []);

  if (!status) return null;

  const toggle = async () => {
    setBusy(true);
    setError(null);
    if (status === 'enabled') {
      setStatus(await pushService.disable());
    } else {
      const result = await pushService.enable();
      setStatus(result.status);
      setError(result.error);
    }
    setBusy(false);
  };

  const canToggle = status === 'enabled' || status === 'disabled';

  if (variant === 'card') {
    if (status !== 'disabled') return null;
    return (
      <div className="mt-4 flex items-center gap-3 rounded-card bg-primary p-4 text-white shadow-card-hover">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
          <BellRing size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">No te pierdas ningún pedido</p>
          <p className="text-xs text-white/75">Activa los avisos en este celular.</p>
          {error && <p className="mt-1 text-xs text-accent-light">{error}</p>}
        </div>
        <button
          onClick={toggle}
          disabled={busy}
          className="shrink-0 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-primary disabled:opacity-60"
        >
          {busy ? 'Activando…' : 'Activar'}
        </button>
      </div>
    );
  }

  const on = status === 'enabled';
  return (
    <div className="flex items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface text-ink/50">
          <BellRing size={17} />
        </span>
        <div>
          <p className="text-sm font-medium text-ink">Avisos en el celular</p>
          <p className="mt-0.5 text-xs text-ink/50">{STATUS_TEXT[status]}</p>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      </div>
      {canToggle && (
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={toggle}
          disabled={busy}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${on ? 'bg-primary' : 'bg-ink/15'}`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-card transition-transform duration-200 ${
              on ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      )}
    </div>
  );
}
