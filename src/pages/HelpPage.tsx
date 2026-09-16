import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, ChevronDown, Mail } from 'lucide-react';

const FAQS: { question: string; answer: string }[] = [
  {
    question: '¿Cómo compro un producto?',
    answer:
      'Explora los productos desde la pestaña "Explorar" o busca por categoría, entra al producto o al perfil del emprendimiento, y desde ahí puedes hacer tu pedido o escribirle al vendedor con el botón "Preguntar" antes de decidir.',
  },
  {
    question: '¿Cómo vendo en UniHub?',
    answer:
      'Ve a tu Perfil y toca "Crea tu negocio y empieza a vender". Una vez creado tu emprendimiento, podrás publicar productos desde tu panel del emprendedor.',
  },
  {
    question: '¿Qué significa "Disponible ahora"?',
    answer:
      'Es un indicador que el propio emprendedor prende o apaga según si puede responder mensajes o entregar pedidos en ese momento. Le ayuda a los compradores a saber qué tan rápido pueden esperar respuesta.',
  },
  {
    question: '¿Cómo funciona el chat?',
    answer:
      'Desde el perfil de cualquier emprendimiento puedes tocar "Preguntar" para abrir una conversación. Todo el historial queda guardado dentro de la app, así que no necesitas usar WhatsApp ni otras redes para coordinar con el vendedor.',
  },
  {
    question: '¿Por qué no puedo poner mi WhatsApp en la descripción o el chat?',
    answer:
      'Por seguridad y para mantener un registro de lo acordado, UniHub no permite compartir contacto directo (WhatsApp, redes sociales, teléfono) en descripciones ni mensajes. Toda la coordinación debe quedar dentro de la app.',
  },
  {
    question: '¿Qué significa que un emprendimiento esté "verificado"?',
    answer:
      'La insignia de verificado la otorga el equipo de UniHub tras revisar la identidad universitaria del emprendedor. Ningún usuario puede activarla por su cuenta.',
  },
];

export function HelpPage() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="px-4 pt-4 pb-8 md:px-6 md:pt-6 md:max-w-lg md:mx-auto">
      <div className="mb-5 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-control text-ink/60 hover:bg-ink/5"
          aria-label="Volver"
        >
          <ArrowLeft size={19} />
        </button>
        <h1 className="font-serif text-2xl font-semibold text-ink">Ayuda</h1>
      </div>

      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink/40">
        Preguntas frecuentes
      </p>
      <div className="flex flex-col divide-y divide-ink/6 rounded-card-lg border border-ink/8 bg-white shadow-card overflow-hidden">
        {FAQS.map((faq, i) => {
          const open = openIndex === i;
          return (
            <div key={i}>
              <button
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <span className="text-sm font-medium text-ink">{faq.question}</span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-ink/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
              </button>
              {open && <p className="px-4 pb-4 text-sm leading-relaxed text-ink/60">{faq.answer}</p>}
            </div>
          );
        })}
      </div>

      <p className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide text-ink/40">
        ¿Necesitas más ayuda?
      </p>
      
              
        href="mailto:johandavidcabreracajamarca@gmail.com?subject=Ayuda%20con%20UniHub"
        className="flex items-center gap-3 rounded-card-lg border border-ink/8 bg-white p-4 shadow-card hover:bg-ink/5 transition-colors"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-control bg-accent-light text-accent">
          <Mail size={17} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">Escríbenos</p>
          <p className="text-xs text-ink/50 truncate">johandavidcabreracajamarca@gmail.com</p>
        </div>
      </a>
    </div>
  );
}
