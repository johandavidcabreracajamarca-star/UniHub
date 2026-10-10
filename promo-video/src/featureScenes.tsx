import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { BadgeCheck, Cake, Cookie, MapPin, MessageCircle, Package, SendHorizontal, Share2, Store } from 'lucide-react';
import { C, SCENES, serif } from './theme';
import { Grain, Headline, LogoMark, PaperBackground, ProductTile, Reveal, Scene, clamp, useSpr } from './components';

// Escenas de las funciones nuevas: chat, avisos al celular y compartir.

const PAD = 90;

/* ------------------------------------------------------------------ */
/* Chat con el emprendedor                                             */
/* ------------------------------------------------------------------ */
function Bubble({ mine, delay, children }: { mine: boolean; delay: number; children: ReactNode }) {
  const p = useSpr(delay, { damping: 14, stiffness: 150 });
  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          maxWidth: '78%',
          padding: '24px 30px',
          fontSize: 36,
          lineHeight: 1.3,
          borderRadius: 36,
          borderBottomRightRadius: mine ? 10 : 36,
          borderBottomLeftRadius: mine ? 36 : 10,
          background: mine ? C.primary : 'white',
          color: mine ? 'white' : C.ink,
          boxShadow: mine ? '0 10px 24px rgba(105,65,217,0.25)' : '0 6px 18px rgba(36,32,51,0.08)',
          transformOrigin: mine ? 'bottom right' : 'bottom left',
          transform: `translateY(${(1 - p) * 30}px) scale(${0.6 + 0.4 * Math.min(1, p)})`,
          opacity: Math.min(1, p * 1.6),
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Typing({ from, to }: { from: number; to: number }) {
  const frame = useCurrentFrame();
  const visible = interpolate(frame, [from, from + 4, to - 4, to], [0, 1, 1, 0], clamp);
  if (visible <= 0) return null;
  return (
    <div style={{ display: 'flex', opacity: visible, height: visible * 84, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 10, padding: '28px 32px', borderRadius: 36, borderBottomLeftRadius: 10, background: 'white' }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: 99,
              background: 'rgba(36,32,51,0.35)',
              transform: `translateY(${Math.sin((frame - i * 4) / 3) * 5}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function ChatScene() {
  const card = useSpr(8, { damping: 16, stiffness: 90 });
  const meet = useSpr(108, { damping: 12 });
  return (
    <Scene duration={SCENES.chat}>
      <PaperBackground />
      <div style={{ position: 'absolute', top: 150, left: PAD, right: PAD }}>
        <Reveal delay={0}>
          <Headline size={100}>Habla directo</Headline>
        </Reveal>
        <Reveal delay={7}>
          <Headline size={100} color={C.primary}>
            con quien lo hace
          </Headline>
        </Reveal>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 480,
          left: PAD,
          right: PAD,
          borderRadius: 48,
          overflow: 'hidden',
          background: 'white',
          boxShadow: '0 40px 90px rgba(36,32,51,0.14)',
          transform: `translateY(${(1 - card) * 500}px)`,
          opacity: Math.min(1, card * 1.5),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '30px 36px', borderBottom: '2px solid rgba(36,32,51,0.06)' }}>
          <div style={{ width: 92, height: 92, borderRadius: 99, background: C.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cake size={46} color={C.accentDark} strokeWidth={1.7} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: serif, fontSize: 42, fontWeight: 600 }}>
              Dulce EAN <BadgeCheck size={32} fill={C.primary} color="white" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 26, color: '#15803d', fontWeight: 600 }}>
              <span style={{ width: 12, height: 12, borderRadius: 99, background: '#16a34a' }} /> Disponible ahora
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, padding: '36px 32px', background: C.surface, minHeight: 640 }}>
          <Bubble mine delay={18}>¡Hola! ¿Te quedan cupcakes para hoy?</Bubble>
          <Typing from={36} to={60} />
          <Bubble mine={false} delay={60}>¡Sí! Te los llevo a la biblioteca a las 3 p. m.</Bubble>
          <Bubble mine delay={90}>¡Perfecto, allá nos vemos!</Bubble>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '22px 28px' }}>
          <div style={{ flex: 1, borderRadius: 99, background: C.surface, padding: '20px 28px', fontSize: 28, color: 'rgba(36,32,51,0.4)' }}>Escribe un mensaje…</div>
          <div style={{ width: 76, height: 76, borderRadius: 99, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SendHorizontal size={34} color="white" />
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: PAD,
          right: PAD,
          top: 1470,
          display: 'flex',
          justifyContent: 'center',
          transform: `translateY(${(1 - meet) * 120}px) scale(${0.85 + 0.15 * meet})`,
          opacity: Math.min(1, meet * 1.5),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: C.accent, color: C.ink, borderRadius: 99, padding: '24px 36px', fontSize: 34, fontWeight: 700, boxShadow: '0 20px 40px rgba(255,128,108,0.4)' }}>
          <MapPin size={36} /> Acuerden la entrega en el campus
        </div>
      </div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ */
/* Avisos al celular                                                   */
/* ------------------------------------------------------------------ */
const NOTIFICATIONS = [
  { delay: 24, title: 'UniHub · Tu pedido', body: 'Tu pedido ahora está: Confirmado.' },
  { delay: 58, title: 'Mensaje de Camila', body: '¡Ya estoy en la biblioteca!' },
  { delay: 92, title: '¡Nueva venta! 🎉', body: 'Yohan te pidió 2 × Brownie con nueces · $11.000' },
];
const CARD_H = 210;
const CARD_GAP = 24;

function NotificationCard({ title, body, style }: { title: string; body: string; style: CSSProperties }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: PAD - 20,
        right: PAD - 20,
        height: CARD_H,
        display: 'flex',
        gap: 26,
        alignItems: 'center',
        padding: '0 34px',
        borderRadius: 44,
        background: 'rgba(255,255,255,0.9)',
        boxShadow: '0 24px 60px rgba(20,10,60,0.35)',
        ...style,
      }}
    >
      <div style={{ width: 96, height: 96, borderRadius: 24, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <LogoMark size={72} shadow={false} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, color: 'rgba(36,32,51,0.55)', fontWeight: 600, letterSpacing: 1 }}>
          <span>UNIHUB</span>
          <span style={{ letterSpacing: 0, fontWeight: 500 }}>ahora</span>
        </div>
        <div style={{ fontSize: 34, fontWeight: 800, color: C.ink, marginTop: 4 }}>{title}</div>
        <div style={{ fontSize: 30, color: 'rgba(36,32,51,0.8)', lineHeight: 1.25, marginTop: 2 }}>{body}</div>
      </div>
    </div>
  );
}

export function NotificationsScene() {
  const frame = useCurrentFrame();
  const progress = NOTIFICATIONS.map((n) => useSpr(n.delay, { damping: 15, stiffness: 130 }));
  const clock = useSpr(10, { damping: 18 });
  const pills = useSpr(118, { damping: 13 });
  const baseY = 830;

  return (
    <Scene duration={SCENES.notifications} bg={C.secondary}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 20% 15%, rgba(105,65,217,0.95), transparent 60%), radial-gradient(circle at 90% 85%, rgba(255,128,108,0.55), transparent 55%), linear-gradient(170deg, #2a1d5e, ${C.secondary})`,
        }}
      />
      <Grain opacity={0.12} />

      <div style={{ position: 'absolute', top: 140, left: PAD, right: PAD }}>
        <Reveal delay={0}>
          <Headline size={104} color="white">
            Te avisamos
          </Headline>
        </Reveal>
        <Reveal delay={6}>
          <Headline size={104} color={C.accent}>
            al instante
          </Headline>
        </Reveal>
        <Reveal delay={14} y={30}>
          <div style={{ fontSize: 40, color: 'rgba(255,255,255,0.75)', marginTop: 18, fontWeight: 500 }}>aunque tengas la app cerrada</div>
        </Reveal>
      </div>

      <div style={{ position: 'absolute', top: 560, width: '100%', textAlign: 'center', color: 'white', opacity: clock * 0.92 }}>
        <div style={{ fontSize: 32, fontWeight: 600, opacity: 0.8 }}>viernes, 9 de octubre</div>
        <div style={{ fontSize: 170, fontWeight: 300, letterSpacing: -4, lineHeight: 1 }}>3:05</div>
      </div>

      {NOTIFICATIONS.map((n, i) => {
        const p = progress[i];
        // Las más nuevas quedan arriba y empujan a las anteriores hacia abajo
        const pushedDown = progress.slice(i + 1).reduce((sum, q) => sum + Math.min(1, q), 0);
        const y = baseY + pushedDown * (CARD_H + CARD_GAP);
        return (
          <NotificationCard
            key={n.title}
            title={n.title}
            body={n.body}
            style={{
              top: y,
              opacity: Math.min(1, p * 1.4),
              transform: `translateY(${(1 - p) * -90}px) scale(${0.92 + 0.08 * Math.min(1, p)})`,
              zIndex: 10 + i,
            }}
          />
        );
      })}

      <div
        style={{
          position: 'absolute',
          top: 1620,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          gap: 18,
          opacity: pills,
          transform: `translateY(${(1 - pills) * 60}px)`,
        }}
      >
        {[
          { Icon: Package, label: 'Pedidos' },
          { Icon: MessageCircle, label: 'Mensajes' },
          { Icon: Store, label: 'Ventas' },
        ].map(({ Icon, label }) => (
          <div
            key={label}
            style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.14)', color: 'white', borderRadius: 99, padding: '18px 30px', fontSize: 32, fontWeight: 700 }}
          >
            <Icon size={32} /> {label}
          </div>
        ))}
      </div>
      {/* pequeño brillo cuando entra cada aviso */}
      {NOTIFICATIONS.map((n) => {
        const flash = interpolate(frame, [n.delay, n.delay + 3, n.delay + 14], [0, 0.18, 0], clamp);
        return <AbsoluteFill key={`f-${n.delay}`} style={{ background: 'white', opacity: flash, pointerEvents: 'none' }} />;
      })}
    </Scene>
  );
}

/* ------------------------------------------------------------------ */
/* Compartir                                                           */
/* ------------------------------------------------------------------ */
export function ShareScene() {
  const frame = useCurrentFrame();
  const tile = useSpr(8, { damping: 15, stiffness: 100 });
  const press = interpolate(frame, [34, 38, 44], [1, 0.84, 1], clamp);
  const ripple = interpolate(frame, [38, 58], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const message = useSpr(50, { damping: 14, stiffness: 120 });
  const reply = useSpr(84, { damping: 13, stiffness: 140 });

  return (
    <Scene duration={SCENES.share}>
      <PaperBackground />
      <div style={{ position: 'absolute', top: 150, left: PAD, right: PAD }}>
        <Reveal delay={0}>
          <Headline size={96}>¿Viste algo bueno?</Headline>
        </Reveal>
        <Reveal delay={6}>
          <Headline size={96} color={C.primary}>
            Compártelo
          </Headline>
        </Reveal>
        <Reveal delay={12} y={30}>
          <div style={{ fontSize: 38, color: 'rgba(36,32,51,0.6)', marginTop: 16, fontWeight: 500 }}>
            por WhatsApp o donde quieras, con un toque
          </div>
        </Reveal>
      </div>

      <div
        style={{
          position: 'absolute',
          left: PAD,
          top: 560,
          width: 440,
          transform: `translateX(${(1 - tile) * -600}px) rotate(${-4 + (1 - tile) * -10}deg)`,
        }}
      >
        <ProductTile
          name="Caja de 6 cupcakes"
          business="Dulce EAN"
          price={24000}
          rating={4.9}
          Icon={Cookie}
          tone={{ bg: C.secondaryLight, fg: C.accentDark }}
          scale={1.6}
        />
        <div style={{ position: 'absolute', right: -34, top: -34, width: 112, height: 112 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 99,
              background: C.primary,
              opacity: (1 - ripple) * 0.45,
              transform: `scale(${1 + ripple * 1.6})`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 99,
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 16px 36px rgba(36,32,51,0.2)',
              transform: `scale(${press})`,
            }}
          >
            <Share2 size={48} color={C.primary} />
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: PAD,
          top: 1120,
          width: 620,
          transformOrigin: 'top right',
          transform: `translateY(${(1 - message) * 80}px) scale(${0.7 + 0.3 * Math.min(1, message)})`,
          opacity: Math.min(1, message * 1.5),
        }}
      >
        <div style={{ background: C.primaryLight, borderRadius: 40, borderTopRightRadius: 12, padding: 18, boxShadow: '0 20px 50px rgba(105,65,217,0.18)' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', background: 'white', borderRadius: 26, padding: 16 }}>
            <div style={{ width: 110, height: 110, borderRadius: 20, background: C.secondaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Cookie size={56} color={C.accentDark} strokeWidth={1.5} />
            </div>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>Caja de 6 cupcakes</div>
              <div style={{ fontSize: 24, color: 'rgba(36,32,51,0.55)', marginTop: 4 }}>UniHub · Dulce EAN</div>
            </div>
          </div>
          <div style={{ fontSize: 33, lineHeight: 1.3, padding: '18px 14px 8px', color: C.ink }}>
            Mira Caja de 6 cupcakes por $24.000 de Dulce EAN en UniHub 👀
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: PAD,
          top: 1540,
          transformOrigin: 'top left',
          transform: `translateY(${(1 - reply) * 60}px) scale(${0.6 + 0.4 * Math.min(1, reply)})`,
          opacity: Math.min(1, reply * 1.5),
        }}
      >
        <div style={{ background: 'white', borderRadius: 36, borderTopLeftRadius: 10, padding: '26px 34px', fontSize: 38, fontWeight: 600, boxShadow: '0 16px 40px rgba(36,32,51,0.12)' }}>
          ¡Pídeme dos! 😍
        </div>
      </div>
    </Scene>
  );
}
