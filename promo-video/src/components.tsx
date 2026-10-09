import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { BadgeCheck, Plus, Star, type LucideIcon } from 'lucide-react';
import { C, fontFamily, formatCOP, serif } from './theme';

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export function useSpr(delay = 0, config: Parameters<typeof spring>[0]['config'] = { damping: 14, stiffness: 120 }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
}

// Entrada con desplazamiento + desenfoque, estilo "kinetic typography"
export function Reveal({
  delay = 0,
  children,
  y = 60,
  style,
  blur = true,
}: {
  delay?: number;
  children: ReactNode;
  y?: number;
  style?: CSSProperties;
  blur?: boolean;
}) {
  const p = useSpr(delay, { damping: 16, stiffness: 110 });
  return (
    <div
      style={{
        opacity: interpolate(p, [0, 0.6], [0, 1], clamp),
        transform: `translateY(${(1 - p) * y}px)`,
        filter: blur ? `blur(${(1 - Math.min(p, 1)) * 12}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Envuelve cada escena: salida suave (zoom + fade) en los últimos frames
export function Scene({ duration, children, bg }: { duration: number; children: ReactNode; bg?: string }) {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [duration - 12, duration], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <AbsoluteFill
      style={{
        fontFamily,
        color: C.ink,
        background: bg,
        opacity: 1 - out,
        transform: `scale(${1 + out * 0.06})`,
        filter: `blur(${out * 10}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

// Fondo papel con manchas de color que respiran
export function PaperBackground({ tint = C.surface }: { tint?: string }) {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const blob = (x: number, y: number, size: number, color: string, phase: number): CSSProperties => ({
    position: 'absolute',
    left: x + Math.sin(t * 0.6 + phase) * 60,
    top: y + Math.cos(t * 0.5 + phase) * 80,
    width: size,
    height: size,
    borderRadius: '50%',
    background: color,
    filter: 'blur(120px)',
    opacity: 0.55,
  });
  return (
    <AbsoluteFill style={{ background: tint, overflow: 'hidden' }}>
      <div style={blob(-200, 100, 700, C.primaryLight, 0)} />
      <div style={blob(600, 1100, 800, C.accentLight, 2)} />
      <div style={blob(500, -200, 500, C.secondaryLight, 4)} />
      <Grain />
    </AbsoluteFill>
  );
}

export function Grain({ opacity = 0.07 }: { opacity?: number }) {
  return (
    <AbsoluteFill
      style={{
        opacity,
        mixBlendMode: 'multiply',
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      }}
    />
  );
}

// Isotipo oficial (la "U" violeta con detalle coral) — mismo archivo que public/favicon.svg
export function LogoMark({ size = 200, variant = 'color', shadow = true }: { size?: number; variant?: 'color' | 'light'; shadow?: boolean }) {
  return (
    <Img
      src={staticFile(variant === 'light' ? 'logo-light.svg' : 'logo.svg')}
      style={{
        width: size,
        height: size,
        filter: shadow ? `drop-shadow(0 ${size * 0.08}px ${size * 0.12}px rgba(105,65,217,0.35))` : undefined,
      }}
    />
  );
}

export function Stars({ rating, size = 22, fillProgress = 1 }: { rating: number; size?: number; fillProgress?: number }) {
  return (
    <div style={{ display: 'flex', gap: size * 0.15 }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const f = Math.max(0, Math.min(1, fillProgress * 5 - i)) * Math.min(1, Math.max(0, rating - i));
        return (
          <div key={i} style={{ position: 'relative', width: size, height: size }}>
            <Star size={size} color={C.accent} strokeWidth={1.8} style={{ position: 'absolute', opacity: 0.35 }} />
            <div style={{ position: 'absolute', inset: 0, width: size * f, overflow: 'hidden' }}>
              <Star size={size} color={C.accent} fill={C.accent} strokeWidth={1.8} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Verified({ scale = 1 }: { scale?: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8 * scale,
        background: C.primary,
        color: 'white',
        borderRadius: 999,
        padding: `${8 * scale}px ${18 * scale}px`,
        fontSize: 24 * scale,
        fontWeight: 700,
      }}
    >
      <BadgeCheck size={26 * scale} fill="white" color={C.primary} />
      Verificado
    </span>
  );
}

// Tarjeta de producto inspirada en src/components/ProductCard.tsx
export function ProductTile({
  name,
  business,
  price,
  rating,
  Icon,
  tone,
  scale = 1,
  style,
}: {
  name: string;
  business: string;
  price: number;
  rating: number;
  Icon: LucideIcon;
  tone: { bg: string; fg: string };
  scale?: number;
  style?: CSSProperties;
}) {
  const s = scale;
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 26 * s,
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(36,32,51,0.10)',
        border: '1px solid rgba(36,32,51,0.05)',
        ...style,
      }}
    >
      <div
        style={{
          aspectRatio: '4 / 3',
          background: `radial-gradient(circle at 30% 30%, ${tone.bg}, ${shade(tone.bg)})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={70 * s} color={tone.fg} strokeWidth={1.5} />
      </div>
      <div style={{ padding: 16 * s }}>
        <div style={{ fontSize: 21 * s, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 * s, marginTop: 4 * s }}>
          <span style={{ fontSize: 17 * s, color: 'rgba(36,32,51,0.6)' }}>{business}</span>
          <BadgeCheck size={19 * s} fill={C.primary} color="white" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 * s }}>
          <div>
            <div style={{ fontSize: 23 * s, fontWeight: 800 }}>{formatCOP(price)}</div>
            <Stars rating={rating} size={14 * s} />
          </div>
          <div
            style={{
              width: 44 * s,
              height: 44 * s,
              borderRadius: 999,
              background: C.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={24 * s} color="white" strokeWidth={2.6} />
          </div>
        </div>
      </div>
    </div>
  );
}

function shade(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const f = 0.88;
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return `rgb(${r},${g},${b})`;
}

// Marco de teléfono
export function Phone({ children, width = 640, style }: { children: ReactNode; width?: number; style?: CSSProperties }) {
  const height = width * 2.05;
  return (
    <div
      style={{
        width,
        height,
        borderRadius: width * 0.14,
        background: '#1d1916',
        padding: width * 0.03,
        boxShadow: '0 60px 120px rgba(36,32,51,0.35), 0 20px 40px rgba(36,32,51,0.2), inset 0 0 0 3px #3a332e',
        position: 'relative',
        ...style,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: width * 0.115,
          background: C.surface,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children}
        <div
          style={{
            position: 'absolute',
            top: width * 0.03,
            left: '50%',
            transform: 'translateX(-50%)',
            width: width * 0.3,
            height: width * 0.075,
            borderRadius: 999,
            background: '#1d1916',
          }}
        />
      </div>
    </div>
  );
}

export function Headline({ children, size = 96, color = C.ink, style }: { children: ReactNode; size?: number; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ fontFamily: serif, fontSize: size, fontWeight: 600, letterSpacing: -size * 0.025, lineHeight: 1.04, color, ...style }}>
      {children}
    </div>
  );
}
