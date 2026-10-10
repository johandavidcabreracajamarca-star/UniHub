import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import {
  ArrowRight,
  Bell,
  BookOpen,
  Cake,
  Cookie,
  Cpu,
  Download,
  Eye,
  GraduationCap,
  Heart,
  Laptop,
  Mail,
  Palette,
  Search,
  Shirt,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  Utensils,
  Watch,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { C, SCENES, formatCOP, serif } from './theme';
import { Grain, Headline, LogoMark, PaperBackground, Phone, ProductTile, Reveal, Scene, Stars, Verified, clamp, useSpr } from './components';

const PAD = 90;

/* ------------------------------------------------------------------ */
/* 1. Hook                                                             */
/* ------------------------------------------------------------------ */
export function HookScene() {
  const frame = useCurrentFrame();
  const underline = interpolate(frame, [34, 52], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const floaters: { Icon: LucideIcon; x: number; y: number; d: number; color: string }[] = [
    { Icon: Cake, x: 760, y: 360, d: 30, color: C.accentDark },
    { Icon: Laptop, x: 120, y: 1400, d: 38, color: C.primary },
    { Icon: Shirt, x: 820, y: 1500, d: 46, color: C.secondary },
    { Icon: BookOpen, x: 170, y: 330, d: 54, color: C.primary },
  ];
  return (
    <Scene duration={SCENES.hook}>
      <PaperBackground />
      {floaters.map(({ Icon, x, y, d, color }, i) => {
        const p = useSpr(d, { damping: 10, stiffness: 90 });
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y + Math.sin((frame + i * 20) / 14) * 14,
              transform: `scale(${p}) rotate(${(1 - p) * 40 + Math.sin(frame / 20 + i) * 6}deg)`,
              width: 150,
              height: 150,
              borderRadius: 40,
              background: 'white',
              boxShadow: '0 20px 50px rgba(36,32,51,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={72} color={color} strokeWidth={1.6} />
          </div>
        );
      })}
      <AbsoluteFill style={{ justifyContent: 'center', padding: PAD }}>
        <Reveal delay={4}>
          <Headline size={150}>Tu campus</Headline>
        </Reveal>
        <Reveal delay={12}>
          <Headline size={150}>está lleno</Headline>
        </Reveal>
        <Reveal delay={20}>
          <Headline size={150} color={C.primary} style={{ position: 'relative', display: 'inline-block' }}>
            de talento.
            <div
              style={{
                position: 'absolute',
                left: 0,
                bottom: -6,
                height: 18,
                width: `${underline * 100}%`,
                background: C.accent,
                opacity: 0.55,
                borderRadius: 999,
                zIndex: -1,
              }}
            />
          </Headline>
        </Reveal>
      </AbsoluteFill>
    </Scene>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Pregunta                                                         */
/* ------------------------------------------------------------------ */
export function QuestionScene() {
  const frame = useCurrentFrame();
  const card = (Icon: LucideIcon, text: string, color: string, delay: number, from: number, fg = 'white') => {
    const p = useSpr(delay, { damping: 15, stiffness: 120 });
    return (
      <div
        style={{
          transform: `translateX(${(1 - p) * from}px) rotate(${(1 - p) * (from > 0 ? 8 : -8)}deg)`,
          opacity: interpolate(p, [0, 0.4], [0, 1], clamp),
          display: 'flex',
          alignItems: 'center',
          gap: 36,
          background: 'white',
          borderRadius: 48,
          padding: '44px 52px',
          boxShadow: '0 30px 70px rgba(36,32,51,0.12)',
        }}
      >
        <div style={{ width: 130, height: 130, borderRadius: 36, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={66} color={fg} strokeWidth={2} />
        </div>
        <Headline size={92}>{text}</Headline>
      </div>
    );
  };
  const appear = useSpr(42, { damping: 12 });
  return (
    <Scene duration={SCENES.question}>
      <PaperBackground />
      <AbsoluteFill style={{ justifyContent: 'center', padding: PAD, gap: 40 }}>
        {card(Search, '¿Buscas algo?', C.primary, 2, -1100)}
        {card(Store, '¿Vendes algo?', C.accent, 14, 1100, C.ink)}
        <div style={{ height: 60 }} />
        <div style={{ transform: `scale(${appear})`, opacity: appear, textAlign: 'center' }}>
          <Headline size={80} color={C.secondary}>
            Hay una app
            <br />
            <span style={{ color: C.primary }}>hecha para ti</span>
            <span style={{ display: 'inline-block', transform: `translateX(${Math.sin(frame / 4) * 6}px)` }}>…</span>
          </Headline>
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Logo                                                             */
/* ------------------------------------------------------------------ */
export function LogoScene() {
  const frame = useCurrentFrame();
  const wipe = interpolate(frame, [0, 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const logo = useSpr(6, { damping: 11, stiffness: 100 });
  const word = 'UniHub';
  return (
    <Scene duration={SCENES.logo}>
      <PaperBackground />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 45%, ${C.primary}, ${C.primaryDark} 75%)`,
          clipPath: `circle(${wipe * 150}% at 50% 45%)`,
        }}
      >
        {[0, 1, 2].map((i) => {
          const t = ((frame - 10 - i * 14) % 60) / 60;
          return frame > 10 + i * 14 ? (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '42%',
                width: 300,
                height: 300,
                borderRadius: '50%',
                border: '3px solid rgba(237,230,252,0.5)',
                transform: `translate(-50%,-50%) scale(${1 + t * 3})`,
                opacity: 1 - t,
              }}
            />
          ) : null;
        })}
        <Grain opacity={0.1} />
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 120 }}>
          <div style={{ transform: `scale(${logo}) rotate(${(1 - logo) * -25}deg)` }}>
            <LogoMark size={340} variant="light" shadow={false} />
          </div>
          <div style={{ display: 'flex', marginTop: 60 }}>
            {word.split('').map((ch, i) => {
              const p = useSpr(20 + i * 3, { damping: 12, stiffness: 140 });
              return (
                <span
                  key={i}
                  style={{
                    fontFamily: serif,
                    fontSize: 200,
                    fontWeight: 600,
                    letterSpacing: -5,
                    color: 'white',
                    display: 'inline-block',
                    transform: `translateY(${(1 - p) * 120}px)`,
                    opacity: Math.min(1, p * 1.5),
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
          <Reveal delay={42} y={30}>
            <div style={{ fontSize: 46, fontWeight: 500, color: C.primaryLight, textAlign: 'center', lineHeight: 1.3, marginTop: 10 }}>
              Conectando ideas,
              <br />
              impulsando emprendimientos.
            </div>
          </Reveal>
        </AbsoluteFill>
      </AbsoluteFill>
    </Scene>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Explorar — mockup del teléfono                                   */
/* ------------------------------------------------------------------ */
const PRODUCTS = [
  { name: 'Torta de chocolate', business: 'Dulce EAN', price: 8000, rating: 4.9, Icon: Cake, tone: { bg: C.accentLight, fg: C.accentDark } },
  { name: 'Buzo EAN Classic', business: 'EAN Style', price: 68000, rating: 4.8, Icon: Shirt, tone: { bg: C.primaryLight, fg: C.primary } },
  { name: 'Tutoría de Cálculo', business: 'Student Tutors', price: 30000, rating: 5, Icon: GraduationCap, tone: { bg: C.secondaryLight, fg: C.secondary } },
  { name: 'Cable USB-C 1m', business: 'Tech Campus', price: 15000, rating: 4.7, Icon: Cpu, tone: { bg: C.primaryLight, fg: C.primaryDark } },
  { name: 'Caja de 6 cupcakes', business: 'Dulce EAN', price: 24000, rating: 4.9, Icon: Cookie, tone: { bg: C.secondaryLight, fg: C.accentDark } },
  { name: 'Gorra bordada EAN', business: 'EAN Style', price: 35000, rating: 4.6, Icon: Watch, tone: { bg: C.accentLight, fg: C.secondary } },
];

export function ExploreScene() {
  const frame = useCurrentFrame();
  const phone = useSpr(10, { damping: 16, stiffness: 80 });
  const scroll = interpolate(frame, [70, 135], [0, 560], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const tagP = useSpr(100, { damping: 11 });
  return (
    <Scene duration={SCENES.explore}>
      <PaperBackground />
      <div style={{ position: 'absolute', top: 150, left: PAD, right: PAD }}>
        <Reveal delay={0}>
          <Headline size={86}>Descubre lo que</Headline>
        </Reveal>
        <Reveal delay={7}>
          <Headline size={86} color={C.primary}>
            crean tus compañeros
          </Headline>
        </Reveal>
      </div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 520,
          transform: `translateX(-50%) translateY(${(1 - phone) * 900}px) rotate(${(1 - phone) * 6}deg)`,
        }}
      >
        <Phone width={700}>
          <div style={{ transform: `translateY(${-scroll}px)` }}>
            <div style={{ position: 'relative', overflow: 'hidden', background: C.primary, color: 'white', borderRadius: '0 0 52px 52px', padding: '96px 32px 34px' }}>
              <div style={{ position: 'absolute', right: -60, top: -40, width: 300, height: 300, borderRadius: 999, background: 'rgba(255,255,255,0.07)' }} />
              <div style={{ position: 'absolute', right: 50, top: 210, width: 100, height: 100, borderRadius: 999, background: C.accent, opacity: 0.9 }} />
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <LogoMark size={52} variant="light" shadow={false} />
                  <span style={{ fontFamily: serif, fontSize: 34, fontWeight: 700 }}>UniHub</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Bell size={30} color="white" />
                  <div style={{ width: 56, height: 56, borderRadius: 999, background: C.surface, color: C.primary, fontWeight: 700, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Y</div>
                </div>
              </div>
              <div style={{ position: 'relative', marginTop: 28, fontSize: 22, opacity: 0.75, fontWeight: 500 }}>Hola, Yohan</div>
              <div style={{ position: 'relative', marginTop: 4, fontFamily: serif, fontSize: 42, fontWeight: 600, lineHeight: 1.1, maxWidth: 400, letterSpacing: -0.5 }}>
                Lo que emprende tu universidad
              </div>
              <div style={{ position: 'relative', marginTop: 24, background: 'white', borderRadius: 22, padding: '20px 24px', display: 'flex', gap: 14, alignItems: 'center', color: 'rgba(36,32,51,0.5)', fontSize: 24, boxShadow: '0 8px 20px rgba(36,32,51,0.25)' }}>
                <Search size={26} />
                ¿Qué estás buscando?
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '28px 30px 0' }}>
              {[
                ['Todas', ShoppingBag, C.primary, 'white'],
                ['Comida', Utensils, C.accentLight, C.accentDark],
                ['Ropa', Shirt, C.primaryLight, C.primary],
                ['Tecnología', Cpu, C.secondaryLight, C.ink],
                ['Servicios', Wrench, C.accentLight, C.accentDark],
              ].map(([label, Icon, bg, fg]) => {
                const I = Icon as LucideIcon;
                return (
                  <div key={label as string} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 96, height: 96, borderRadius: 30, background: bg as string, color: fg as string, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(36,32,51,0.08)' }}>
                      <I size={38} strokeWidth={1.7} />
                    </div>
                    <span style={{ fontSize: 17, fontWeight: 600, color: label === 'Todas' ? C.primary : C.ink }}>{label as string}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ margin: '30px 30px 0' }}>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>Destacados de la semana</div>
              <div style={{ fontSize: 19, color: 'rgba(36,32,51,0.5)', marginTop: 2 }}>Los mejor calificados y los nuevos en la U</div>
              <div style={{ display: 'flex', gap: 18, marginTop: 16 }}>
                {[
                  { name: 'Dulce EAN', rating: '4.8', Icon: Cake, bg: C.accentLight, fg: C.accentDark, isNew: true },
                  { name: 'Tech Campus', rating: '4.6', Icon: Cpu, bg: C.primaryLight, fg: C.primary, isNew: false },
                ].map((b, i) => {
                  const s = useSpr(22 + i * 6, { damping: 14, stiffness: 120 });
                  return (
                    <div
                      key={b.name}
                      style={{ flex: 1, background: 'white', borderRadius: 24, overflow: 'hidden', boxShadow: '0 6px 18px rgba(36,32,51,0.08)', transform: `scale(${0.85 + 0.15 * s})`, opacity: Math.min(1, s * 1.4) }}
                    >
                      <div style={{ position: 'relative', height: 110, background: b.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <b.Icon size={48} color={b.fg} strokeWidth={1.6} />
                        {b.isNew && (
                          <span style={{ position: 'absolute', left: 0, top: 12, background: C.accent, color: C.ink, fontSize: 16, fontWeight: 800, padding: '4px 12px', borderRadius: '0 10px 10px 0' }}>
                            Nuevo
                          </span>
                        )}
                      </div>
                      <div style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>{b.name}</div>
                        <div style={{ fontSize: 19, color: 'rgba(36,32,51,0.6)', marginTop: 2 }}>★ {b.rating}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, margin: '26px 30px 0' }}>
              {PRODUCTS.map((p, i) => {
                const s = useSpr(34 + i * 5, { damping: 14, stiffness: 120 });
                return (
                  <ProductTile
                    key={p.name}
                    {...p}
                    scale={0.92}
                    style={{ transform: `translateY(${(1 - s) * 80}px) scale(${0.9 + s * 0.1})`, opacity: Math.min(1, s * 1.4) }}
                  />
                );
              })}
            </div>
          </div>
        </Phone>
      </div>
      {/* Etiqueta flotante */}
      <div
        style={{
          position: 'absolute',
          right: 40,
          top: 1020,
          transform: `scale(${tagP}) rotate(${-6 + Math.sin(frame / 12) * 2}deg)`,
          background: C.accent,
          color: C.ink,
          borderRadius: 28,
          padding: '22px 30px',
          boxShadow: '0 25px 50px rgba(255,128,108,0.45)',
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 600, opacity: 0.85 }}>Hecho en la U</div>
        <div style={{ fontSize: 44, fontWeight: 900 }}>desde {formatCOP(5500)}</div>
      </div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Categorías                                                       */
/* ------------------------------------------------------------------ */
const CATS: { label: string; Icon: LucideIcon; bg: string; fg: string; x: number; y: number }[] = [
  { label: 'Comida', Icon: Utensils, bg: C.accent, fg: C.ink, x: -230, y: -330 },
  { label: 'Ropa', Icon: Shirt, bg: 'white', fg: C.ink, x: 220, y: -420 },
  { label: 'Tecnología', Icon: Cpu, bg: C.primary, fg: 'white', x: 170, y: -230 },
  { label: 'Tutorías', Icon: GraduationCap, bg: 'white', fg: C.ink, x: -200, y: 300 },
  { label: 'Accesorios', Icon: Watch, bg: C.secondary, fg: 'white', x: 210, y: 400 },
  { label: 'Servicios', Icon: Wrench, bg: 'white', fg: C.ink, x: 190, y: 230 },
  { label: 'Diseño', Icon: Palette, bg: C.accentLight, fg: C.accentDark, x: -240, y: 470 },
  { label: 'Postres', Icon: Cake, bg: C.primaryLight, fg: C.primaryDark, x: -250, y: -480 },
];

export function CategoriesScene() {
  const frame = useCurrentFrame();
  return (
    <Scene duration={SCENES.categories} bg={C.secondaryLight}>
      <Grain />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        {CATS.map((c, i) => {
          const p = useSpr(4 + i * 4, { damping: 12, stiffness: 90 });
          const angle = Math.atan2(c.y, c.x);
          const fromX = Math.cos(angle) * 1400;
          const fromY = Math.sin(angle) * 1400;
          return (
            <div
              key={c.label}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%,-50%) translate(${c.x * p + fromX * (1 - p)}px, ${c.y * p + fromY * (1 - p) + Math.sin((frame + i * 13) / 15) * 10}px) rotate(${Math.sin(i) * 7}deg)`,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '26px 40px',
                borderRadius: 999,
                background: c.bg,
                color: c.fg,
                fontSize: 48,
                fontWeight: 700,
                boxShadow: '0 20px 40px rgba(36,32,51,0.12)',
                whiteSpace: 'nowrap',
              }}
            >
              <c.Icon size={48} strokeWidth={2} />
              {c.label}
            </div>
          );
        })}
        <div style={{ textAlign: 'center' }}>
          <Reveal delay={20}>
            <Headline size={112} color={C.secondary}>
              Todo en
            </Headline>
          </Reveal>
          <Reveal delay={27}>
            <Headline size={112} color={C.primary}>
              un solo lugar
            </Headline>
          </Reveal>
          <Reveal delay={36}>
            <div style={{ fontSize: 40, fontWeight: 500, marginTop: 20, color: 'rgba(36,32,51,0.65)' }}>sin salir del campus</div>
          </Reveal>
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Confianza                                                        */
/* ------------------------------------------------------------------ */
export function TrustScene() {
  const frame = useCurrentFrame();
  const cardP = useSpr(14, { damping: 15, stiffness: 100 });
  const badge = useSpr(34, { damping: 8, stiffness: 160 });
  const starsP = interpolate(frame, [42, 68], [0, 1], clamp);
  const rating = interpolate(frame, [42, 68], [0, 4.9], clamp);
  const bubble = useSpr(70, { damping: 13 });
  const mail = useSpr(86, { damping: 13 });
  return (
    <Scene duration={SCENES.trust}>
      <PaperBackground />
      <div style={{ position: 'absolute', top: 280, left: PAD, right: PAD }}>
        <Reveal delay={0}>
          <Headline size={120}>Compra con</Headline>
        </Reveal>
        <Reveal delay={7}>
          <Headline size={120} color={C.primary}>
            confianza.
          </Headline>
        </Reveal>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 680,
          left: PAD,
          right: PAD,
          background: 'white',
          borderRadius: 48,
          padding: 52,
          boxShadow: '0 40px 90px rgba(36,32,51,0.14)',
          transform: `translateY(${(1 - cardP) * 300}px) rotateX(${(1 - cardP) * 30}deg)`,
          opacity: Math.min(1, cardP * 1.5),
        }}
      >
        <div style={{ display: 'flex', gap: 34, alignItems: 'center' }}>
          <div style={{ width: 170, height: 170, borderRadius: 999, background: C.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cake size={88} color={C.accentDark} strokeWidth={1.6} />
          </div>
          <div>
            <div style={{ fontFamily: serif, fontSize: 64, fontWeight: 600, letterSpacing: -1.5 }}>Dulce EAN</div>
            <div style={{ fontSize: 28, color: 'rgba(36,32,51,0.55)', marginTop: 4 }}>Ciencias Administrativas</div>
            <div style={{ marginTop: 16, transform: `scale(${badge})`, transformOrigin: 'left center' }}>
              <Verified scale={1.2} />
            </div>
          </div>
        </div>
        <div style={{ height: 2, background: 'rgba(36,32,51,0.07)', margin: '40px 0 34px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ fontSize: 88, fontWeight: 900, color: C.ink, letterSpacing: -3, width: 160 }}>{rating.toFixed(1)}</div>
          <div>
            <Stars rating={4.9} size={48} fillProgress={starsP} />
            <div style={{ fontSize: 28, color: 'rgba(36,32,51,0.55)', marginTop: 8 }}>{Math.round(starsP * 128)} reseñas de estudiantes</div>
          </div>
        </div>
        <div
          style={{
            marginTop: 38,
            background: C.primaryLight,
            borderRadius: 32,
            borderTopLeftRadius: 8,
            padding: '30px 36px',
            transform: `scale(${bubble})`,
            transformOrigin: 'top left',
          }}
        >
          <div style={{ fontSize: 40, fontWeight: 700 }}>“¡La mejor torta de la U!”</div>
          <div style={{ fontSize: 26, color: 'rgba(36,32,51,0.55)', marginTop: 8 }}>Camila · Ingeniería</div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 1420,
          left: PAD,
          right: PAD,
          display: 'flex',
          alignItems: 'center',
          gap: 26,
          background: C.primary,
          color: 'white',
          borderRadius: 36,
          padding: '34px 40px',
          transform: `translateY(${(1 - mail) * 200}px)`,
          opacity: mail,
        }}
      >
        <ShieldCheck size={64} strokeWidth={1.8} />
        <div>
          <div style={{ fontSize: 36, fontWeight: 800 }}>Solo estudiantes verificados</div>
          <div style={{ fontSize: 28, display: 'flex', alignItems: 'center', gap: 10, opacity: 0.85, marginTop: 6 }}>
            <Mail size={26} /> @universidadean.edu.co
          </div>
        </div>
      </div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Vende                                                            */
/* ------------------------------------------------------------------ */
export function SellerScene() {
  const frame = useCurrentFrame();
  const dash = useSpr(26, { damping: 16, stiffness: 90 });
  const ease = { ...clamp, easing: Easing.out(Easing.cubic) };
  const sales = interpolate(frame, [40, 95], [0, 1240000], ease);
  const visits = Math.round(interpolate(frame, [40, 95], [0, 186], ease));
  const favorites = Math.round(interpolate(frame, [40, 95], [0, 24], ease));
  const toast = useSpr(100, { damping: 13, stiffness: 130 });
  const days = [
    { d: 'V', v: 0.42 },
    { d: 'S', v: 0.3 },
    { d: 'D', v: 0.25 },
    { d: 'L', v: 0.62 },
    { d: 'M', v: 0.55 },
    { d: 'X', v: 0.8 },
    { d: 'J', v: 1 },
  ];
  return (
    <Scene duration={SCENES.seller} bg={C.secondary}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 85% 8%, rgba(105,65,217,0.75), transparent 60%), radial-gradient(circle at 0% 100%, rgba(255,128,108,0.25), transparent 50%)` }} />
      <Grain opacity={0.1} />
      <div style={{ position: 'absolute', top: 150, left: PAD, right: PAD }}>
        <Reveal delay={0}>
          <Headline size={96} color="white">
            ¿Tienes un
          </Headline>
        </Reveal>
        <Reveal delay={6}>
          <Headline size={96} color="white">
            emprendimiento?
          </Headline>
        </Reveal>
        <Reveal delay={16}>
          <Headline size={96} color={C.accent} style={{ marginTop: 12 }}>
            Mira cómo crece.
          </Headline>
        </Reveal>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 720,
          left: PAD,
          right: PAD,
          background: C.surface,
          borderRadius: 48,
          padding: '46px 48px',
          transform: `translateY(${(1 - dash) * 800}px)`,
          boxShadow: '0 50px 100px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontFamily: serif, fontSize: 46, fontWeight: 600 }}>Cómo te va esta semana</div>
          <div style={{ fontSize: 24, color: 'rgba(36,32,51,0.45)' }}>7 días</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 28, fontWeight: 600, color: 'rgba(36,32,51,0.6)', marginTop: 26 }}>
          <TrendingUp size={30} color={C.primary} /> Ventas del mes
        </div>
        <div style={{ fontSize: 100, fontWeight: 900, letterSpacing: -4, lineHeight: 1.05 }}>{formatCOP(sales)}</div>

        <div style={{ display: 'flex', gap: 20, marginTop: 26 }}>
          <div style={{ flex: 1, background: C.primaryLight, borderRadius: 28, padding: '22px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 24, fontWeight: 600, color: C.primaryDark }}>
              <Eye size={24} /> Visitas
            </div>
            <div style={{ fontSize: 60, fontWeight: 900 }}>{visits}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#15803d' }}>↑ 13% vs. semana pasada</div>
          </div>
          <div style={{ flex: 1, background: C.accentLight, borderRadius: 28, padding: '22px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 24, fontWeight: 600, color: C.accentDark }}>
              <Heart size={24} /> En favoritos
            </div>
            <div style={{ fontSize: 60, fontWeight: 900 }}>{favorites}</div>
            <div style={{ fontSize: 22, color: 'rgba(36,32,51,0.55)' }}>estudiantes te siguen</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 220, marginTop: 34 }}>
          {days.map((day, i) => {
            const g = interpolate(frame, [48 + i * 5, 76 + i * 5], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
            const today = i === days.length - 1;
            return (
              <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: '100%',
                    height: `${day.v * g * 82}%`,
                    borderRadius: 14,
                    background: today ? C.accent : C.primary,
                    opacity: today ? 1 : 0.4 + i * 0.08,
                  }}
                />
                <span style={{ fontSize: 22, fontWeight: today ? 800 : 500, color: today ? C.ink : 'rgba(36,32,51,0.45)' }}>{day.d}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 600,
          left: PAD + 20,
          right: PAD + 20,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          background: 'white',
          borderRadius: 32,
          padding: '26px 30px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
          transform: `translateY(${(1 - toast) * -500}px) scale(${0.8 + toast * 0.2})`,
          opacity: toast,
        }}
      >
        <div style={{ width: 84, height: 84, borderRadius: 24, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Store size={42} color={C.ink} style={{ transform: `rotate(${Math.sin(frame / 2) * 12 * Math.max(0, 1 - (frame - 100) / 30)}deg)` }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 32, fontWeight: 800 }}>¡Nueva venta! 🎉</div>
          <div style={{ fontSize: 26, color: 'rgba(36,32,51,0.6)' }}>Yohan te pidió 2 × Brownie · {formatCOP(11000)}</div>
        </div>
      </div>
    </Scene>
  );
}

/* ------------------------------------------------------------------ */
/* 8. Llamado a la acción                                              */
/* ------------------------------------------------------------------ */
export function CtaScene() {
  const frame = useCurrentFrame();
  const logo = useSpr(4, { damping: 10, stiffness: 110 });
  const btn = useSpr(40, { damping: 11 });
  const pulse = 1 + Math.max(0, Math.sin((frame - 60) / 8)) * 0.035 * (frame > 60 ? 1 : 0);
  const shine = ((frame - 55) % 70) / 70;
  const perks: { Icon: LucideIcon; label: string }[] = [
    { Icon: Users, label: 'Comunidad' },
    { Icon: ShieldCheck, label: 'Confianza' },
    { Icon: Sparkles, label: 'Emprendimiento' },
  ];
  return (
    <Scene duration={SCENES.cta + 30}>
      <PaperBackground />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: PAD, textAlign: 'center' }}>
        <div style={{ transform: `scale(${logo}) rotate(${(1 - logo) * 20}deg)` }}>
          <LogoMark size={250} />
        </div>
        <Reveal delay={12} style={{ marginTop: 56 }}>
          <Headline size={136}>Únete a</Headline>
        </Reveal>
        <Reveal delay={18}>
          <Headline size={170} color={C.primary} style={{ letterSpacing: -4 }}>
            UniHub
          </Headline>
        </Reveal>
        <Reveal delay={26}>
          <div style={{ fontSize: 42, fontWeight: 500, color: 'rgba(36,32,51,0.65)', marginTop: 24, lineHeight: 1.35 }}>
            El marketplace de confianza
            <br />
            de la comunidad universitaria.
          </div>
        </Reveal>
        <div style={{ display: 'flex', gap: 20, marginTop: 56 }}>
          {perks.map(({ Icon, label }, i) => {
            const p = useSpr(32 + i * 4, { damping: 12 });
            const color = [C.primary, C.secondary, C.accentDark][i];
            return (
              <div
                key={label}
                style={{
                  transform: `scale(${p})`,
                  background: 'white',
                  borderRadius: 28,
                  padding: '22px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 10px 30px rgba(36,32,51,0.08)',
                  minWidth: 220,
                }}
              >
                <Icon size={44} color={color} />
                <span style={{ fontSize: 26, fontWeight: 600, color: 'rgba(36,32,51,0.7)' }}>{label}</span>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 60,
            transform: `scale(${btn * pulse})`,
            background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
            color: 'white',
            fontSize: 52,
            fontWeight: 800,
            borderRadius: 999,
            padding: '38px 70px',
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            boxShadow: '0 30px 60px rgba(105,65,217,0.4)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          Crea tu cuenta gratis
          <ArrowRight size={52} strokeWidth={2.6} style={{ transform: `translateX(${Math.sin(frame / 6) * 6}px)` }} />
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 160,
              left: `${-30 + shine * 160}%`,
              background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.35), transparent)',
              transform: 'skewX(-20deg)',
            }}
          />
        </div>
        <Reveal delay={50}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 14,
              marginTop: 40,
              background: C.primaryLight,
              color: C.primaryDark,
              borderRadius: 99,
              padding: '18px 30px',
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            <Download size={30} /> Gratis · instálala en tu pantalla de inicio
          </div>
        </Reveal>
        <Reveal delay={60}>
          <div style={{ fontSize: 30, color: 'rgba(36,32,51,0.5)', marginTop: 28, fontWeight: 500 }}>
            Comenzando en <b style={{ color: C.primary }}>Universidad EAN</b> · usa tu correo institucional
          </div>
        </Reveal>
      </AbsoluteFill>
    </Scene>
  );
}
