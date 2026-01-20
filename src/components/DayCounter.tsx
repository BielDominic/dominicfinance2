import { useState, useEffect } from 'react';
import { Calendar, Edit2, Check, X } from 'lucide-react';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface DayCounterProps {
  targetDate: string;
  onDateChange: (date: string) => void;
  label?: string;
}

export function DayCounter({ targetDate, onDateChange, label = 'Contagem' }: DayCounterProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    if (!targetDate) return undefined;
    try {
      const date = parseISO(targetDate);
      return isValid(date) ? date : undefined;
    } catch {
      return undefined;
    }
  });

  useEffect(() => {
    if (!targetDate) {
      setSelectedDate(undefined);
      return;
    }
    try {
      const date = parseISO(targetDate);
      if (isValid(date)) {
        setSelectedDate(date);
      }
    } catch {
      // ignore invalid dates
    }
  }, [targetDate]);

  const today = new Date();
  const daysRemaining = selectedDate ? differenceInDays(selectedDate, today) : null;

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDateChange(format(date, 'yyyy-MM-dd'));
      setIsCalendarOpen(false);
    }
  };

  const getCounterText = () => {
    if (daysRemaining === null) return 'Definir data';
    if (daysRemaining === 0) return 'Hoje!';
    if (daysRemaining === 1) return '1 dia';
    if (daysRemaining > 0) return `${daysRemaining} dias`;
    if (daysRemaining === -1) return 'Há 1 dia';
    return `Há ${Math.abs(daysRemaining)} dias`;
  };

  const getCounterColor = () => {
    if (daysRemaining === null) return 'text-muted-foreground';
    if (daysRemaining === 0) return 'text-future';
    if (daysRemaining > 0) return 'text-income';
    return 'text-expense';
  };

  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
      <Calendar className="h-4 w-4 text-future shrink-0" />
      <div className="flex flex-col min-w-0">
        <span className="text-xs text-muted-foreground truncate">{label}</span>
        <div className="flex items-center gap-2">
          <span className={cn('font-mono font-bold text-sm', getCounterColor())}>
            {getCounterText()}
          </span>
          {selectedDate && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              ({format(selectedDate, 'dd/MM/yy', { locale: ptBR })})
            </span>
          )}
        </div>
      </div>
      
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 shrink-0 hover:bg-background"
          >
            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            locale={ptBR}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
