import { BadgeCheck } from 'lucide-react';

export function VerifiedBadge({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return <BadgeCheck size={16} className="fill-secondary text-white shrink-0" />;
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary-light px-2 py-0.5 text-xs font-medium text-secondary">
      <BadgeCheck size={13} className="fill-secondary text-white" />
      Verificado
    </span>
  );
}
