import { cn } from '@/lib/utils';
import { Person } from '@/types/financial';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PersonBadgeProps {
  person: Person;
  className?: string;
  editable?: boolean;
  onChange?: (person: Person) => void;
}

export function PersonBadge({ person, className, editable = false, onChange }: PersonBadgeProps) {
  if (editable && onChange) {
    return (
      <Select value={person} onValueChange={(v) => onChange(v as Person)}>
        <SelectTrigger 
          className={cn(
            'h-7 w-[100px] border-0 bg-transparent p-0 focus:ring-0',
            className
          )}
        >
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
              person === 'Gabriel' && 'bg-primary/10 text-primary',
              person === 'Myrelle' && 'bg-accent text-accent-foreground',
              person === 'Ambos' && 'bg-muted text-muted-foreground'
            )}
          >
            {person}
          </span>
        </SelectTrigger>
        <SelectContent className="bg-popover border shadow-md z-50">
          <SelectItem value="Gabriel">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
              Gabriel
            </span>
          </SelectItem>
          <SelectItem value="Myrelle">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent text-accent-foreground">
              Myrelle
            </span>
          </SelectItem>
          <SelectItem value="Ambos">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
              Ambos
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        person === 'Gabriel' && 'bg-primary/10 text-primary',
        person === 'Myrelle' && 'bg-accent text-accent-foreground',
        person === 'Ambos' && 'bg-muted text-muted-foreground',
        className
      )}
    >
      {person}
    </span>
  );
}
