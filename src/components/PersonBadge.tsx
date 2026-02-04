import { cn } from '@/lib/utils';
import { usePersonOptions } from '@/hooks/usePeople';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PersonBadgeProps {
  person: string;
  className?: string;
  editable?: boolean;
  onChange?: (person: string) => void;
}

export function PersonBadge({ person, className, editable = false, onChange }: PersonBadgeProps) {
  const options = usePersonOptions();

  // Find the color for the current person
  const currentOption = options.find(o => o.value === person);
  const currentColor = currentOption?.color || '#6366f1';

  const getBadgeStyle = (color: string) => ({
    backgroundColor: `${color}20`,
    color: color,
    borderColor: `${color}40`,
  });

  if (editable && onChange) {
    return (
      <Select value={person} onValueChange={onChange}>
        <SelectTrigger 
          className={cn(
            'h-7 w-[110px] border-0 bg-transparent p-0 focus:ring-0',
            className
          )}
        >
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
            style={getBadgeStyle(currentColor)}
          >
            {person || 'Selecionar'}
          </span>
        </SelectTrigger>
        <SelectContent className="bg-popover border shadow-md z-50">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span 
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
                style={getBadgeStyle(option.color)}
              >
                {option.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
        className
      )}
      style={getBadgeStyle(currentColor)}
    >
      {person}
    </span>
  );
}
