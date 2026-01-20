import { cn } from '@/lib/utils';
import { EntryStatus } from '@/types/financial';

interface StatusBadgeProps {
  status: EntryStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
        status === 'Entrada' && 'bg-income-light text-income',
        status === 'Futuros' && 'bg-future-light text-future',
        className
      )}
    >
      {status}
    </span>
  );
}
