interface BrandMarkProps {
  size?: number;
  className?: string;
}

/**
 * Isotipo de UniHub (bolsa con la "U"). Usa el mismo archivo que el favicon
 * (public/favicon.svg) para que la marca se vea idéntica en toda la app,
 * el ícono de la pantalla de inicio y las vistas previas al compartir.
 */
export function BrandMark({ size = 32, className = '' }: BrandMarkProps) {
  return (
    <img
      src="/favicon.svg"
      width={size}
      height={size}
      alt=""
      draggable={false}
      className={`shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
