import { useNavigate } from 'react-router-dom';
import type { Business } from '../types';
import { ImagePlaceholder } from './ImagePlaceholder';
import { VerifiedBadge } from './VerifiedBadge';
import { StarRating } from './StarRating';
import { CATEGORY_LABELS } from '../types';

export function BusinessCard({ business }: { business: Business }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/business/${business.id}`)}
      className="group text-left shrink-0 w-40 rounded-card bg-white shadow-card hover:shadow-card-hover transition-shadow overflow-hidden border border-ink/5"
    >
      <ImagePlaceholder category={business.category} className="h-20 w-full" iconSize={22} />
      <div className="p-2.5">
        <div className="flex items-center gap-1 min-w-0">
          <h3 className="text-sm font-semibold text-ink truncate">{business.name}</h3>
          {business.verified && <VerifiedBadge compact />}
        </div>
        <p className="text-xs text-ink/50 truncate">{CATEGORY_LABELS[business.category]}</p>
        <div className="mt-1.5">
          <StarRating rating={business.rating} size={12} reviewCount={business.review_count} />
        </div>
      </div>
    </button>
  );
}
