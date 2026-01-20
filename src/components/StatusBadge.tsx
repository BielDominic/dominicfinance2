import { cn } from '@/lib/utils';
import { EntryStatus } from '@/types/financial';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StatusBadgeProps {
  status: EntryStatus;
  className?: string;
  editable?: boolean;
  onChange?: (status: EntryStatus) => void;
}

export function StatusBadge({ status, className, editable = false, onChange }: StatusBadgeProps) {
  if (editable && onChange) {
    return (
      <Select value={status} onValueChange={(v) => onChange(v as EntryStatus)}>
        <SelectTrigger 
          className={cn(
            'h-7 w-[100px] border-0 bg-transparent p-0 focus:ring-0',
            className
          )}
        >
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              status === 'Entrada' && 'bg-income-light text-income',
              status === 'Futuros' && 'bg-future-light text-future'
            )}
          >
            {status}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Entrada">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-income-light text-income">
              Entrada
            </span>
          </SelectItem>
          <SelectItem value="Futuros">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-future-light text-future">
              Futuros
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    );
  }

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
