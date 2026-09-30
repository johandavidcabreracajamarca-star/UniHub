interface BrandMarkProps {
  size?: number;
  className?: string;
  /**
   * "color": logo violeta + coral, para fondos claros (por defecto).
   * "light": la "U" en blanco cálido + coral, para fondos violeta u oscuros.
   */
  variant?: 'color' | 'light';
}

/**
 * Isotipo de UniHub (la "U" violeta con el detalle coral). La versión a color
 * usa el mismo archivo que el favicon (public/favicon.svg) para que la marca
 * se vea idéntica en toda la app; la versión clara vive en public/logo-light.svg.
 */
export function BrandMark({ size = 32, className = '', variant = 'color' }: BrandMarkProps) {
  const src = variant === 'light' ? '/logo-light.svg' : '/favicon.svg';
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      draggable={false}
      className={`shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
