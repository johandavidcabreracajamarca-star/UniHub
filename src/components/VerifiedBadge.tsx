import { BadgeCheck } from 'lucide-react';

export function VerifiedBadge({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return <BadgeCheck size={16} className="fill-secondary text-white shrink-0" />;
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
      <BadgeCheck size={14} className="fill-white text-secondary" />
      Verificado
    </span>
  );
}
