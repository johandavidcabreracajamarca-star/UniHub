import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
}

export function StarRating({ rating, size = 14, showValue = true, reviewCount }: StarRatingProps) {
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
