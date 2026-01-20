import { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, Edit2 } from 'lucide-react';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import confetti from 'canvas-confetti';

interface DayCounterProps {
  targetDate: string;
  onDateChange: (date: string) => void;
  title: string;
  onTitleChange: (title: string) => void;
  progressPercentage?: number;
}

// Generate coin positions based on progress
function generateCoins(progress: number, side: 'left' | 'right') {
  const coins: { id: number; bottom: number; delay: number; size: number; opacity: number }[] = [];
  const coinCount = Math.floor(progress / 5); // More coins as progress increases
  
  for (let i = 0; i < Math.min(coinCount, 20); i++) {
    coins.push({
      id: i,
      bottom: (i / 20) * 100, // Stack from bottom
      delay: i * 0.1,
      size: 16 + Math.random() * 8,
      opacity: 0.6 + Math.random() * 0.4,
    });
  }
  
  return coins;
}

export function DayCounter({ targetDate, onDateChange, title, onTitleChange, progressPercentage = 0 }: DayCounterProps) {
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

  const leftCoins = useMemo(() => generateCoins(progressPercentage, 'left'), [progressPercentage]);
  const rightCoins = useMemo(() => generateCoins(progressPercentage, 'right'), [progressPercentage]);

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

  // Trigger confetti when daysRemaining is 0
  useEffect(() => {
    if (daysRemaining === 0 && !confettiRef.current) {
      confettiRef.current = true;
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: ReturnType<typeof setInterval> = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#16a34a', '#ffffff', '#f97316']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
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
    if (daysRemaining === 0) return 'text-ireland-green';
    if (daysRemaining > 0) return 'text-income';
    return 'text-expense';
  };

  // Calculate fill height based on progress
  const fillHeight = Math.min(progressPercentage, 100);

  return (
    <div className="relative w-full flex flex-col items-center gap-3">
      {/* Gold coins animation - Left side */}
      <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 overflow-hidden pointer-events-none">
        <div 
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-400/30 via-amber-300/20 to-transparent transition-all duration-1000 ease-out"
          style={{ height: `${fillHeight}%` }}
        />
        {leftCoins.map((coin) => (
          <div
            key={coin.id}
            className="absolute animate-bounce"
            style={{
              bottom: `${coin.bottom}%`,
              left: `${20 + Math.random() * 40}%`,
              animationDelay: `${coin.delay}s`,
              animationDuration: '2s',
              opacity: coin.opacity,
            }}
          >
            <span style={{ fontSize: coin.size }} className="drop-shadow-lg">🪙</span>
          </div>
        ))}
      </div>

      {/* Gold coins animation - Right side */}
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 overflow-hidden pointer-events-none">
        <div 
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-400/30 via-amber-300/20 to-transparent transition-all duration-1000 ease-out"
          style={{ height: `${fillHeight}%` }}
        />
        {rightCoins.map((coin) => (
          <div
            key={coin.id}
            className="absolute animate-bounce"
            style={{
              bottom: `${coin.bottom}%`,
              right: `${20 + Math.random() * 40}%`,
              animationDelay: `${coin.delay + 0.5}s`,
              animationDuration: '2s',
              opacity: coin.opacity,
            }}
          >
            <span style={{ fontSize: coin.size }} className="drop-shadow-lg">🪙</span>
          </div>
        ))}
      </div>

      {/* Editable title with decorations */}
      <div className="flex items-center gap-3 z-10">
        <span className="text-2xl">☘️</span>
        {isEditingTitle ? (
          <Input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') {
                setTitleInput(title);
                setIsEditingTitle(false);
              }
            }}
            className="text-lg sm:text-xl font-bold text-ireland-green text-center uppercase tracking-wide bg-transparent border-ireland-green/30 max-w-xs"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsEditingTitle(true)}
            className="text-lg sm:text-xl font-bold text-ireland-green uppercase tracking-wide hover:underline cursor-pointer"
          >
            {title}
          </button>
        )}
        <span className="text-2xl">🇮🇪</span>
      </div>

      {/* Big counter display */}
      <div className="flex items-center gap-4 z-10">
        <div className="flex flex-col items-center">
          <span className={cn(
            'font-mono font-black text-4xl sm:text-5xl md:text-6xl tracking-tight',
            getCounterColor(),
            daysRemaining === 0 && 'animate-pulse'
          )}>
            {daysRemaining !== null ? Math.abs(daysRemaining) : '—'}
          </span>
          <span className="text-sm sm:text-base text-muted-foreground font-medium">
            {daysRemaining === null 
              ? 'dias' 
              : daysRemaining === 0 
                ? '🎉 HOJE! 🎉' 
                : daysRemaining > 0 
                  ? 'dias restantes'
                  : 'dias atrás'}
          </span>
        </div>
      </div>

      {/* Progress indicator */}
      {progressPercentage > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground z-10">
          <span>💰 Progresso financeiro:</span>
          <span className={cn(
            "font-mono font-bold",
            progressPercentage >= 100 ? 'text-income' : 'text-highlight'
          )}>
            {progressPercentage.toFixed(0)}%
          </span>
        </div>
      )}

      {/* Date display and edit button */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground z-10">
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
