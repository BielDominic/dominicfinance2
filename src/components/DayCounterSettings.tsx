import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Palette, Sparkles, Leaf, Mountain, Sunset, Moon, Coffee, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CounterBackground = 
  | 'ireland' 
  | 'gradient-purple' 
  | 'gradient-ocean' 
  | 'gradient-sunset' 
  | 'gradient-forest' 
  | 'gradient-night' 
  | 'minimal' 
  | 'travel';

interface BackgroundOption {
  value: CounterBackground;
  label: string;
  icon: React.ElementType;
  preview: string;
  darkPreview?: string;
}

const BACKGROUND_OPTIONS: BackgroundOption[] = [
  {
    value: 'ireland',
    label: 'Irlanda (Padrão)',
    icon: Leaf,
    preview: 'bg-gradient-to-r from-ireland-green/5 via-white/50 to-ireland-orange/5',
    darkPreview: 'dark:from-ireland-green/10 dark:via-card dark:to-ireland-orange/10',
  },
  {
    value: 'gradient-purple',
    label: 'Aurora Boreal',
    icon: Sparkles,
    preview: 'bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-blue-500/10',
  },
  {
    value: 'gradient-ocean',
    label: 'Oceano',
    icon: Mountain,
    preview: 'bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-teal-500/10',
  },
  {
    value: 'gradient-sunset',
    label: 'Pôr do Sol',
    icon: Sunset,
    preview: 'bg-gradient-to-br from-orange-500/10 via-red-500/5 to-pink-500/10',
  },
  {
    value: 'gradient-forest',
    label: 'Floresta',
    icon: Leaf,
    preview: 'bg-gradient-to-br from-green-600/10 via-emerald-500/5 to-lime-500/10',
  },
  {
    value: 'gradient-night',
    label: 'Noite Estrelada',
    icon: Moon,
    preview: 'bg-gradient-to-br from-slate-800/20 via-indigo-900/10 to-purple-900/10',
  },
  {
    value: 'minimal',
    label: 'Minimalista',
    icon: Coffee,
    preview: 'bg-muted/30',
  },
  {
    value: 'travel',
    label: 'Viagem',
    icon: Plane,
    preview: 'bg-gradient-to-br from-sky-500/10 via-amber-500/5 to-rose-500/10',
  },
];

interface DayCounterSettingsProps {
  currentBackground: CounterBackground;
  onBackgroundChange: (bg: CounterBackground) => void;
}

export function DayCounterSettings({ currentBackground, onBackgroundChange }: DayCounterSettingsProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CounterBackground>(currentBackground);

  useEffect(() => {
    setSelected(currentBackground);
  }, [currentBackground]);

  const handleSave = () => {
    onBackgroundChange(selected);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Palette className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Personalizar Contador
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Label>Escolha o tema de fundo</Label>
          <RadioGroup value={selected} onValueChange={(v) => setSelected(v as CounterBackground)} className="grid grid-cols-2 gap-3">
            {BACKGROUND_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.value} className="relative">
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={option.value}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all',
                      'peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary/20',
                      'hover:border-primary/50',
                      option.preview,
                      option.darkPreview
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-medium text-center">{option.label}</span>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Aplicar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function getBackgroundClasses(bg: CounterBackground): string {
  switch (bg) {
    case 'ireland':
      return 'bg-gradient-to-r from-ireland-green/5 via-white/50 to-ireland-orange/5 dark:from-ireland-green/10 dark:via-card dark:to-ireland-orange/10';
    case 'gradient-purple':
      return 'bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-blue-500/10 dark:from-purple-500/20 dark:via-pink-500/10 dark:to-blue-500/20';
    case 'gradient-ocean':
      return 'bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-teal-500/10 dark:from-cyan-500/20 dark:via-blue-500/10 dark:to-teal-500/20';
    case 'gradient-sunset':
      return 'bg-gradient-to-br from-orange-500/10 via-red-500/5 to-pink-500/10 dark:from-orange-500/20 dark:via-red-500/10 dark:to-pink-500/20';
    case 'gradient-forest':
      return 'bg-gradient-to-br from-green-600/10 via-emerald-500/5 to-lime-500/10 dark:from-green-600/20 dark:via-emerald-500/10 dark:to-lime-500/20';
    case 'gradient-night':
      return 'bg-gradient-to-br from-slate-800/20 via-indigo-900/10 to-purple-900/10 dark:from-slate-800/40 dark:via-indigo-900/20 dark:to-purple-900/20';
    case 'minimal':
      return 'bg-muted/30 dark:bg-muted/20';
    case 'travel':
      return 'bg-gradient-to-br from-sky-500/10 via-amber-500/5 to-rose-500/10 dark:from-sky-500/20 dark:via-amber-500/10 dark:to-rose-500/20';
    default:
      return 'bg-gradient-to-r from-ireland-green/5 via-white/50 to-ireland-orange/5 dark:from-ireland-green/10 dark:via-card dark:to-ireland-orange/10';
  }
}
