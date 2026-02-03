import { useState, useEffect, useRef } from 'react';
import { Calendar, Edit2 } from 'lucide-react';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { CounterIcon, CounterColor, getIconEmoji, getColorClasses } from './DayCounterSettings';
import confetti from 'canvas-confetti';
interface DayCounterProps {
  targetDate: string;
  onDateChange: (date: string) => void;
  title: string;
  onTitleChange: (title: string) => void;
  icon?: CounterIcon;
  color?: CounterColor;
}
export function DayCounter({
  targetDate,
  onDateChange,
  title,
  onTitleChange,
  icon = 'shamrock',
  color = 'green'
}: DayCounterProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(title);
  const confettiRef = useRef<boolean>(false);
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
    setTitleInput(title);
  }, [title]);
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
  const colorClasses = getColorClasses(color);
  const iconEmoji = getIconEmoji(icon);

  // Trigger confetti when daysRemaining is 0
  useEffect(() => {
    if (daysRemaining === 0 && !confettiRef.current) {
      confettiRef.current = true;
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 9999
      };
      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }
      const interval: ReturnType<typeof setInterval> = setInterval(function () {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: {
            x: randomInRange(0.1, 0.3),
            y: Math.random() - 0.2
          },
          colors: ['#16a34a', '#ffffff', '#f97316']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: {
            x: randomInRange(0.7, 0.9),
            y: Math.random() - 0.2
          },
          colors: ['#16a34a', '#ffffff', '#f97316']
        });
      }, 250);
      return () => clearInterval(interval);
    } else if (daysRemaining !== 0) {
      confettiRef.current = false;
    }
  }, [daysRemaining]);
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDateChange(format(date, 'yyyy-MM-dd'));
      setIsCalendarOpen(false);
    }
  };
  const handleTitleSubmit = () => {
    onTitleChange(titleInput);
    setIsEditingTitle(false);
  };
  const getCounterColor = () => {
    if (daysRemaining === null) return 'text-muted-foreground';
    if (daysRemaining === 0) return colorClasses.text;
    if (daysRemaining > 0) return 'text-income';
    return 'text-expense';
  };
  return <div className="w-full flex flex-col items-center gap-3">

      {/* Editable title with decorations */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">{iconEmoji}</span>
        {isEditingTitle ? <Input value={titleInput} onChange={e => setTitleInput(e.target.value)} onBlur={handleTitleSubmit} onKeyDown={e => {
        if (e.key === 'Enter') handleTitleSubmit();
        if (e.key === 'Escape') {
          setTitleInput(title);
          setIsEditingTitle(false);
        }
      }} className={cn("text-lg sm:text-xl font-bold text-center uppercase tracking-wide bg-transparent max-w-xs", colorClasses.text, `border-${color}-500/30`)} autoFocus /> : <button onClick={() => setIsEditingTitle(true)} className={cn("text-lg sm:text-xl font-bold uppercase tracking-wide hover:underline cursor-pointer", colorClasses.text)}>
            {title}
          </button>}
        
      </div>

      {/* Big counter display */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center">
          <span className={cn('font-mono font-black text-4xl sm:text-5xl md:text-6xl tracking-tight', getCounterColor(), daysRemaining === 0 && 'animate-pulse')}>
            {daysRemaining !== null ? Math.abs(daysRemaining) : '—'}
          </span>
          <span className="text-sm sm:text-base text-muted-foreground font-medium">
            {daysRemaining === null ? 'dias' : daysRemaining === 0 ? '🎉 HOJE! 🎉' : daysRemaining > 0 ? 'dias restantes' : 'dias atrás'}
          </span>
        </div>
      </div>

      {/* Date display and edit button */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className={cn("h-4 w-4", colorClasses.text)} />
        {selectedDate ? <span className="font-mono">
            {format(selectedDate, "dd 'de' MMMM 'de' yyyy", {
          locale: ptBR
        })}
          </span> : <span>Definir data de destino</span>}
        
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-7 gap-1 text-xs", `border-${color}-500/30 hover:border-${color}-500 hover:bg-${color}-500/10`)}>
              <Edit2 className="h-3 w-3" />
              Editar
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <CalendarComponent mode="single" selected={selectedDate} onSelect={handleDateSelect} locale={ptBR} className="pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>
    </div>;
}