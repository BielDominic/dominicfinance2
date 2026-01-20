import { useState } from 'react';
import { Calendar, Filter, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, parseISO, isWithinInterval, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';

export type PeriodFilterType = 'all' | 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear' | 'custom';

export interface PeriodFilterValue {
  type: PeriodFilterType;
  customRange?: { from: Date; to: Date };
}

interface PeriodFilterProps {
  value: PeriodFilterValue;
  onChange: (value: PeriodFilterValue) => void;
  className?: string;
}

export function PeriodFilter({ value, onChange, className }: PeriodFilterProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange | undefined>(
    value.customRange ? { from: value.customRange.from, to: value.customRange.to } : undefined
  );

  const getDateRange = (type: PeriodFilterType): { from: Date; to: Date } | null => {
    const now = new Date();
    switch (type) {
      case 'thisMonth':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'lastMonth':
        return { from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) };
      case 'last3Months':
        return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) };
      case 'thisYear':
        return { from: startOfYear(now), to: endOfYear(now) };
      case 'custom':
        return value.customRange || null;
      default:
        return null;
    }
  };

  const handleTypeChange = (type: PeriodFilterType) => {
    if (type === 'custom') {
      setIsCalendarOpen(true);
    } else {
      onChange({ type });
    }
  };

  const handleCustomRangeSelect = (range: DateRange | undefined) => {
    setCustomRange(range);
    if (range?.from && range?.to) {
      onChange({ 
        type: 'custom', 
        customRange: { from: range.from, to: range.to } 
      });
      setIsCalendarOpen(false);
    }
  };

  const clearFilter = () => {
    onChange({ type: 'all' });
    setCustomRange(undefined);
  };

  const getFilterLabel = (): string => {
    switch (value.type) {
      case 'thisMonth':
        return 'Este mês';
      case 'lastMonth':
        return 'Mês passado';
      case 'last3Months':
        return 'Últimos 3 meses';
      case 'thisYear':
        return 'Este ano';
      case 'custom':
        if (value.customRange) {
          return `${format(value.customRange.from, 'dd/MM', { locale: ptBR })} - ${format(value.customRange.to, 'dd/MM', { locale: ptBR })}`;
        }
        return 'Personalizado';
      default:
        return 'Todos';
    }
  };

  const filterOptions: { type: PeriodFilterType; label: string }[] = [
    { type: 'all', label: 'Todos' },
    { type: 'thisMonth', label: 'Este mês' },
    { type: 'lastMonth', label: 'Mês passado' },
    { type: 'last3Months', label: '3 meses' },
    { type: 'thisYear', label: 'Ano' },
  ];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex rounded-lg border border-border overflow-hidden bg-background">
        <div className="flex items-center px-2 bg-muted/50 border-r border-border">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        {filterOptions.map((option) => (
          <button
            key={option.type}
            onClick={() => handleTypeChange(option.type)}
            className={cn(
              'px-2 sm:px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
              value.type === option.type
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-muted-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant={value.type === 'custom' ? 'default' : 'outline'} 
            size="sm" 
            className="h-8 gap-1 text-xs"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {value.type === 'custom' ? getFilterLabel() : 'Período'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <CalendarComponent
            mode="range"
            selected={customRange}
            onSelect={handleCustomRangeSelect}
            numberOfMonths={1}
            locale={ptBR}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* Clear Button */}
      {value.type !== 'all' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilter}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Utility function to filter entries by period
export function filterByPeriod<T extends { data?: string | null }>(
  entries: T[],
  filter: PeriodFilterValue
): T[] {
  if (filter.type === 'all') return entries;

  const now = new Date();
  let dateRange: { from: Date; to: Date } | null = null;

  switch (filter.type) {
    case 'thisMonth':
      dateRange = { from: startOfMonth(now), to: endOfMonth(now) };
      break;
    case 'lastMonth':
      dateRange = { from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) };
      break;
    case 'last3Months':
      dateRange = { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) };
      break;
    case 'thisYear':
      dateRange = { from: startOfYear(now), to: endOfYear(now) };
      break;
    case 'custom':
      dateRange = filter.customRange || null;
      break;
  }

  if (!dateRange) return entries;

  return entries.filter(entry => {
    if (!entry.data) return false;
    
    try {
      let entryDate: Date;
      
      // Handle different date formats
      if (entry.data.includes('-')) {
        entryDate = parseISO(entry.data);
      } else if (entry.data.includes('/')) {
        // Handle DD/MM/YYYY format
        const parts = entry.data.split('/');
        entryDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      } else {
        return false;
      }
      
      if (!isValid(entryDate)) return false;
      
      return isWithinInterval(entryDate, { start: dateRange!.from, end: dateRange!.to });
    } catch {
      return false;
    }
  });
}

// Utility function to filter expenses by vencimento (due date)
export function filterExpensesByPeriod<T extends { vencimento?: string | null }>(
  categories: T[],
  filter: PeriodFilterValue
): T[] {
  if (filter.type === 'all') return categories;

  const now = new Date();
  let dateRange: { from: Date; to: Date } | null = null;

  switch (filter.type) {
    case 'thisMonth':
      dateRange = { from: startOfMonth(now), to: endOfMonth(now) };
      break;
    case 'lastMonth':
      dateRange = { from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) };
      break;
    case 'last3Months':
      dateRange = { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) };
      break;
    case 'thisYear':
      dateRange = { from: startOfYear(now), to: endOfYear(now) };
      break;
    case 'custom':
      dateRange = filter.customRange || null;
      break;
  }

  if (!dateRange) return categories;

  return categories.filter(category => {
    if (!category.vencimento) return false;
    
    try {
      let vencimentoDate: Date;
      
      // Handle different date formats
      if (category.vencimento.includes('-')) {
        vencimentoDate = parseISO(category.vencimento);
      } else if (category.vencimento.includes('/')) {
        // Handle DD/MM/YYYY format
        const parts = category.vencimento.split('/');
        vencimentoDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      } else {
        return false;
      }
      
      if (!isValid(vencimentoDate)) return false;
      
      return isWithinInterval(vencimentoDate, { start: dateRange!.from, end: dateRange!.to });
    } catch {
      return false;
    }
  });
}
