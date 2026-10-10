import { useEffect, useState } from 'react';
import { BellRing, CheckCircle2, MessageCircle, Package, Share, Store } from 'lucide-react';
import { pushService, type PushStatus } from '../services/pushService';

// ============================================================================
// INVITACIÓN A ACTIVAR LOS AVISOS
// ============================================================================
// Nunca lanzamos el permiso del sistema de golpe: si la persona dice "No
// permitir" sin entender para qué es, es casi imposible volver a pedirlo.
// Primero explicamos con una pantalla propia y solo al tocar "Activar avisos"
// aparece el cuadro del sistema.
//   • PushWelcome: una sola vez, después de la bienvenida.
//   • PushOfferAfterOrder: tarjeta en la confirmación de cada pedido, mientras
//     los avisos sigan apagados (es cuando más sentido tiene).
// En iPhone sin la app instalada se explica cómo instalarla, porque Safari no
// permite avisos de otra forma.
// ============================================================================

const WELCOME_KEY = 'unihub:push-welcome-seen';

function welcomeSeen() {
  try {
    return localStorage.getItem(WELCOME_KEY) === '1';
  } catch {
    return true;
  }
}

function markWelcomeSeen() {
  try {
    localStorage.setItem(WELCOME_KEY, '1');
  } catch {
    // ignorar
  }
}

/** Estado de los avisos en este dispositivo; null mientras se consulta. */
function usePushStatus() {
  const [status, setStatus] = useState<PushStatus | null>(null);
  useEffect(() => {
    pushService.getStatus().then(setStatus).catch(() => setStatus('unsupported'));
  }, []);
  return [status, setStatus] as const;
}

function InstallSteps() {
  return (
    <ol className="space-y-2 rounded-card bg-surface p-4 text-left text-sm text-ink/80">
      <li className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">1</span>
        <span>
          En Safari, toca <Share size={14} className="inline text-primary" /> <b>Compartir</b>
        </span>
      </li>
      <li className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">2</span>
        <span>
          Elige <b>“Agregar a pantalla de inicio”</b>
        </span>
      </li>
      <li className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">3</span>
        <span>Abre UniHub desde el ícono y activa los avisos</span>
      </li>
    </ol>
  );
}

const PERKS = [
  { Icon: Package, text: 'Cuando el emprendedor confirme o entregue tu pedido' },
  { Icon: MessageCircle, text: 'Cuando te respondan por el chat' },
  { Icon: Store, text: 'Si vendes: cada vez que recibas una venta' },
];

/** Pantalla que invita a activar los avisos la primera vez que alguien entra. */
export function PushWelcome() {
  const [status, setStatus] = usePushStatus();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (welcomeSeen() || (status !== 'disabled' && status !== 'needs-install')) return;
    // Un respiro después de la bienvenida para que no se sienta como un pop-up
    const timer = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(timer);
  }, [status]);

  if (!open) return null;

  const close = () => {
    markWelcomeSeen();
    setOpen(false);
  };

  const activate = async () => {
    setBusy(true);
    const result = await pushService.enable();
    setBusy(false);
    setStatus(result.status);
    if (result.status === 'enabled') {
      setDone(true);
      setTimeout(close, 1400);
    } else {
      close();
    }
  };

  const needsInstall = status === 'needs-install';

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 backdrop-blur-sm md:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-md animate-fade-up rounded-t-[32px] bg-surface px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7 shadow-card-hover md:rounded-[32px]">
        {done ? (
          <div className="py-8 text-center">
            <CheckCircle2 size={56} className="mx-auto text-primary" />
            <h2 className="mt-4 font-serif text-2xl font-semibold text-ink">¡Listo!</h2>
            <p className="mt-1 text-sm text-ink/60">Te avisaremos de todo lo importante.</p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-primary text-white shadow-card">
                <BellRing size={36} strokeWidth={1.8} />
                <span className="absolute -right-1.5 -top-1.5 h-6 w-6 rounded-full border-4 border-surface bg-accent" />
              </div>
              <h2 className="mt-5 font-serif text-2xl font-semibold leading-tight text-ink">
                Entérate al instante de tus pedidos
              </h2>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink/60">
                Activa los avisos y te escribimos aunque tengas la app cerrada:
              </p>
            </div>

            <ul className="mt-5 space-y-2.5">
              {PERKS.map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-3 rounded-control bg-white px-3.5 py-3 text-sm text-ink shadow-card">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                    <Icon size={16} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            {needsInstall ? (
              <>
                <p className="mb-2 mt-5 text-center text-xs font-semibold uppercase tracking-wide text-ink/40">
                  En iPhone, primero instala la app
                </p>
                <InstallSteps />
                <button
                  onClick={close}
                  className="mt-5 h-12 w-full rounded-control bg-primary text-base font-semibold text-white transition-transform active:scale-[0.98]"
                >
                  Entendido
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={activate}
                  disabled={busy}
                  className="mt-6 h-12 w-full rounded-control bg-primary text-base font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
                >
                  {busy ? 'Activando…' : 'Activar avisos'}
                </button>
                <button onClick={close} className="mt-2 h-11 w-full text-sm font-medium text-ink/50">
                  Ahora no
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Tarjeta en "¡Pedido realizado!" mientras los avisos sigan apagados. */
export function PushOfferAfterOrder() {
  const [status, setStatus] = usePushStatus();
  const [busy, setBusy] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [justEnabled, setJustEnabled] = useState(false);

  if (justEnabled) {
    return (
      <p className="mt-4 flex w-full items-center justify-center gap-2 rounded-card bg-primary-light p-3 text-sm font-medium text-primary-dark">
        <CheckCircle2 size={17} /> Listo, te avisaremos cuando cambie tu pedido.
      </p>
    );
  }
  if (status !== 'disabled' && status !== 'needs-install') return null;

  const activate = async () => {
    if (status === 'needs-install') {
      setShowSteps((v) => !v);
      return;
    }
    setBusy(true);
    const result = await pushService.enable();
    setBusy(false);
    setStatus(result.status);
    if (result.status === 'enabled') setJustEnabled(true);
  };

  return (
    <div className="mt-4 w-full rounded-card bg-primary p-4 text-left text-white">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
          <BellRing size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">¿Te avisamos cuando lo confirmen?</p>
          <p className="text-xs text-white/75">Sabrás al instante cómo va tu pedido.</p>
        </div>
        <button
          onClick={activate}
          disabled={busy}
          className="shrink-0 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-primary disabled:opacity-60"
        >
          {busy ? 'Activando…' : status === 'needs-install' ? 'Cómo' : 'Activar'}
        </button>
      </div>
      {showSteps && (
        <div className="mt-3 text-ink">
          <InstallSteps />
        </div>
      )}
    </div>
  );
}
