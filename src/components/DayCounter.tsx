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
    <div className="flex flex-col items-center gap-3">
      {/* Big counter display */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center">
          <span className={cn(
            'font-mono font-black text-4xl sm:text-5xl md:text-6xl tracking-tight',
            getCounterColor()
          )}>
            {daysRemaining !== null ? Math.abs(daysRemaining) : '—'}
          </span>
          <span className="text-sm sm:text-base text-muted-foreground font-medium">
            {daysRemaining === null 
              ? 'dias' 
              : daysRemaining === 0 
                ? 'HOJE!' 
                : daysRemaining > 0 
                  ? 'dias restantes'
                  : 'dias atrás'}
          </span>
        </div>
      </div>

      {/* Date display and edit button */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4 text-ireland-green" />
        {selectedDate ? (
          <span className="font-mono">
            {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>
        ) : (
          <span>Definir data de destino</span>
        )}
        
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 gap-1 text-xs border-ireland-green/30 hover:border-ireland-green hover:bg-ireland-green/10"
            >
              <Edit2 className="h-3 w-3" />
              Editar
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
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
    </div>
  );
}
