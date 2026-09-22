import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
  variant?: 'compact' | 'stars';
}

export function StarRating({
  rating,
  size = 14,
  showValue = true,
  reviewCount,
  variant = 'compact',
}: StarRatingProps) {
  if (variant === 'stars') {
    const filled = Math.round(rating);
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            className={n <= filled ? 'fill-accent text-accent' : 'fill-transparent text-ink/20'}
            strokeWidth={n <= filled ? 0 : 1.5}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Star size={size} className="fill-accent text-accent" strokeWidth={0} />
      {showValue && (
        <span className="text-sm font-medium text-ink">
          {rating > 0 ? rating.toFixed(1) : 'Nuevo'}
        </span>
      )}
      {typeof reviewCount === 'number' && reviewCount > 0 && (
        <span className="text-sm text-ink/50">({reviewCount})</span>
      )}
    </div>
  );
}
