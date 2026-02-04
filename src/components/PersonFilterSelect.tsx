import { User } from 'lucide-react';
import { usePersonOptions } from '@/hooks/usePeople';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PersonFilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function PersonFilterSelect({ value, onChange, className }: PersonFilterSelectProps) {
  const options = usePersonOptions();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className || "w-[130px] h-8 sm:h-9 text-xs sm:text-sm"}>
        <User className="h-3.5 sm:h-4 w-3.5 sm:w-4 mr-1.5 sm:mr-2 text-muted-foreground" />
        <SelectValue placeholder="Pessoa" />
      </SelectTrigger>
      <SelectContent className="bg-popover border shadow-md z-50">
        <SelectItem value="all">Todos</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className="flex items-center gap-2">
              <span 
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: option.color }}
              />
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
