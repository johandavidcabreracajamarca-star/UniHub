import type { ReactNode } from 'react';
import { AlertCircle, Inbox } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 px-6 text-center">
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-ink/5 text-ink/40">
        {icon ?? <Inbox size={22} />}
      </div>
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="text-sm text-ink/50 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertCircle size={22} />
      </div>
      <p className="text-sm font-medium text-ink">Algo salió mal. Intenta nuevamente.</p>
      {message && <p className="text-xs text-ink/40 max-w-xs">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-card overflow-hidden border border-ink/5 bg-white">
          <div className="aspect-[4/3] w-full animate-pulse bg-ink/10" />
          <div className="p-3 space-y-2">
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-ink/10" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-ink/10" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-ink/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-20 w-full animate-pulse rounded-card bg-ink/10" />
      ))}
    </div>
  );
}
