import { cn } from '@/lib/utils';
import { Person } from '@/types/financial';

interface PersonBadgeProps {
  person: Person;
  className?: string;
}

export function PersonBadge({ person, className }: PersonBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        person === 'Gabriel' && 'bg-primary/10 text-primary',
        person === 'Myrelle' && 'bg-accent text-accent-foreground',
        className
      )}
    >
      {person}
    </span>
  );
}
