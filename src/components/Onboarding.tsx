import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Rocket, ShieldCheck, ShoppingBag, type LucideIcon } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { markOnboardingSeen, onboardingSeen } from '../utils/onboarding';


const SLIDES: { Icon: LucideIcon; tone: string; title: string; text: string }[] = [
  {
    Icon: ShoppingBag,
    tone: 'bg-primary text-white',
    title: 'Compra a emprendedores de tu U',
    text: 'Comida, ropa, tecnología, tutorías y más, hechos por estudiantes como tú.',
  },
  {
    Icon: MessageCircle,
    tone: 'bg-accent text-ink',
    title: 'Habla y acuerda la entrega',
    text: 'Escríbele al emprendedor por chat y pónganse de acuerdo en un punto del campus.',
  },
  {
    Icon: ShieldCheck,
    tone: 'bg-secondary text-white',
    title: 'Todos son de tu comunidad',
    text: 'Solo entran estudiantes con correo institucional, y los emprendimientos verificados llevan su insignia.',
  },
  {
    Icon: Rocket,
    tone: 'bg-primary-light text-primary',
    title: '¿Tienes un emprendimiento?',
    text: 'Créalo gratis en un minuto, sube tus productos y empieza a recibir pedidos.',
  },
];

/** Bienvenida de 4 pasos que se muestra una sola vez, la primera vez que alguien entra. */
export function Onboarding({ onDone }: { onDone?: () => void }) {
  const [open, setOpen] = useState(() => !onboardingSeen());
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  if (!open) return null;

  const finish = () => {
    markOnboardingSeen();
    setOpen(false);
    onDone?.();
  };

  const slide = SLIDES[step];
  const last = step === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 backdrop-blur-sm md:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-t-[32px] bg-surface px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 shadow-card-hover md:rounded-[32px]">
        <div className="flex items-center justify-between">
          <BrandMark size={30} />
          <button onClick={finish} className="text-sm font-medium text-ink/50">
            Saltar
          </button>
        </div>

        <div key={step} className="animate-fade-up py-8 text-center">
          <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] shadow-card ${slide.tone}`}>
            <slide.Icon size={42} strokeWidth={1.7} />
          </div>
          <h2 className="mt-6 font-serif text-2xl font-semibold leading-tight text-ink">{slide.title}</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink/60">{slide.text}</p>
        </div>

        <div className="mb-5 flex justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-ink/15'}`}
            />
          ))}
        </div>

        <button
          onClick={() => {
            if (!last) return setStep(step + 1);
            finish();
            navigate('/dashboard');
          }}
          className="h-12 w-full rounded-control bg-primary text-base font-semibold text-white transition-transform active:scale-[0.98]"
        >
          {last ? 'Crear mi emprendimiento' : 'Siguiente'}
        </button>
        {last && (
          <button onClick={finish} className="mt-2 h-11 w-full text-sm font-semibold text-ink/60">
            Por ahora solo quiero explorar
          </button>
        )}
      </div>
    </div>
  );
}
