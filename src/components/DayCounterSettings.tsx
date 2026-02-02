import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Sparkles, Leaf, Mountain, Sunset, Moon, Coffee, Plane, Settings2, Star, Heart, Rocket, Target, Zap, Gift, Crown, PartyPopper, Smile } from 'lucide-react';
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

export type CounterIcon = 'shamrock' | 'star' | 'heart' | 'rocket' | 'target' | 'zap' | 'gift' | 'crown' | 'party' | 'smile';
export type CounterColor = 'green' | 'blue' | 'purple' | 'orange' | 'pink' | 'teal' | 'amber' | 'rose';

interface BackgroundOption {
  value: CounterBackground;
  label: string;
  icon: React.ElementType;
  preview: string;
  darkPreview?: string;
}

interface IconOption {
  value: CounterIcon;
  emoji: string;
  label: string;
}

interface ColorOption {
  value: CounterColor;
  label: string;
  textClass: string;
  bgClass: string;
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

const ICON_OPTIONS: IconOption[] = [
  { value: 'shamrock', emoji: '☘️', label: 'Trevo' },
  { value: 'star', emoji: '⭐', label: 'Estrela' },
  { value: 'heart', emoji: '❤️', label: 'Coração' },
  { value: 'rocket', emoji: '🚀', label: 'Foguete' },
  { value: 'target', emoji: '🎯', label: 'Alvo' },
  { value: 'zap', emoji: '⚡', label: 'Raio' },
  { value: 'gift', emoji: '🎁', label: 'Presente' },
  { value: 'crown', emoji: '👑', label: 'Coroa' },
  { value: 'party', emoji: '🎉', label: 'Festa' },
  { value: 'smile', emoji: '😊', label: 'Sorriso' },
];

const COLOR_OPTIONS: ColorOption[] = [
  { value: 'green', label: 'Verde', textClass: 'text-ireland-green', bgClass: 'bg-ireland-green' },
  { value: 'blue', label: 'Azul', textClass: 'text-blue-500', bgClass: 'bg-blue-500' },
  { value: 'purple', label: 'Roxo', textClass: 'text-purple-500', bgClass: 'bg-purple-500' },
  { value: 'orange', label: 'Laranja', textClass: 'text-orange-500', bgClass: 'bg-orange-500' },
  { value: 'pink', label: 'Rosa', textClass: 'text-pink-500', bgClass: 'bg-pink-500' },
  { value: 'teal', label: 'Turquesa', textClass: 'text-teal-500', bgClass: 'bg-teal-500' },
  { value: 'amber', label: 'Âmbar', textClass: 'text-amber-500', bgClass: 'bg-amber-500' },
  { value: 'rose', label: 'Rosé', textClass: 'text-rose-500', bgClass: 'bg-rose-500' },
];

export interface CounterSettings {
  background: CounterBackground;
  icon: CounterIcon;
  color: CounterColor;
}

interface DayCounterSettingsProps {
  currentBackground: CounterBackground;
  onBackgroundChange: (bg: CounterBackground) => void;
  currentIcon?: CounterIcon;
  onIconChange?: (icon: CounterIcon) => void;
  currentColor?: CounterColor;
  onColorChange?: (color: CounterColor) => void;
}

export function DayCounterSettings({ 
  currentBackground, 
  onBackgroundChange,
  currentIcon = 'shamrock',
  onIconChange,
  currentColor = 'green',
  onColorChange
}: DayCounterSettingsProps) {
  const [open, setOpen] = useState(false);
  const [selectedBg, setSelectedBg] = useState<CounterBackground>(currentBackground);
  const [selectedIcon, setSelectedIcon] = useState<CounterIcon>(currentIcon);
  const [selectedColor, setSelectedColor] = useState<CounterColor>(currentColor);

  useEffect(() => {
    setSelectedBg(currentBackground);
    setSelectedIcon(currentIcon);
    setSelectedColor(currentColor);
  }, [currentBackground, currentIcon, currentColor]);

  const handleSave = () => {
    onBackgroundChange(selectedBg);
    onIconChange?.(selectedIcon);
    onColorChange?.(selectedColor);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Personalizar Contador
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="background" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="background">Fundo</TabsTrigger>
            <TabsTrigger value="icon">Ícone</TabsTrigger>
            <TabsTrigger value="color">Cor</TabsTrigger>
          </TabsList>

          <TabsContent value="background" className="space-y-4 py-4">
            <Label>Escolha o tema de fundo</Label>
            <RadioGroup 
              value={selectedBg} 
              onValueChange={(v) => setSelectedBg(v as CounterBackground)} 
              className="grid grid-cols-2 gap-3"
            >
              {BACKGROUND_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <div key={option.value} className="relative">
                    <RadioGroupItem
                      value={option.value}
                      id={`bg-${option.value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`bg-${option.value}`}
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
          </TabsContent>

          <TabsContent value="icon" className="space-y-4 py-4">
            <Label>Escolha o ícone do contador</Label>
            <RadioGroup 
              value={selectedIcon} 
              onValueChange={(v) => setSelectedIcon(v as CounterIcon)} 
              className="grid grid-cols-5 gap-3"
            >
              {ICON_OPTIONS.map((option) => (
                <div key={option.value} className="relative">
                  <RadioGroupItem
                    value={option.value}
                    id={`icon-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`icon-${option.value}`}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-lg border-2 cursor-pointer transition-all',
                      'peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary/20',
                      'hover:border-primary/50 hover:bg-muted/50'
                    )}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <span className="text-[10px] font-medium text-muted-foreground">{option.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </TabsContent>

          <TabsContent value="color" className="space-y-4 py-4">
            <Label>Escolha a cor principal</Label>
            <RadioGroup 
              value={selectedColor} 
              onValueChange={(v) => setSelectedColor(v as CounterColor)} 
              className="grid grid-cols-4 gap-3"
            >
              {COLOR_OPTIONS.map((option) => (
                <div key={option.value} className="relative">
                  <RadioGroupItem
                    value={option.value}
                    id={`color-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`color-${option.value}`}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all',
                      'peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary/20',
                      'hover:border-primary/50 hover:bg-muted/50'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-full', option.bgClass)} />
                    <span className="text-xs font-medium">{option.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
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

export function getIconEmoji(icon: CounterIcon): string {
  const iconOption = ICON_OPTIONS.find(i => i.value === icon);
  return iconOption?.emoji || '☘️';
}

export function getColorClasses(color: CounterColor): { text: string; bg: string; border: string } {
  switch (color) {
    case 'green':
      return { text: 'text-ireland-green', bg: 'bg-ireland-green', border: 'border-ireland-green' };
    case 'blue':
      return { text: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500' };
    case 'purple':
      return { text: 'text-purple-500', bg: 'bg-purple-500', border: 'border-purple-500' };
    case 'orange':
      return { text: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-500' };
    case 'pink':
      return { text: 'text-pink-500', bg: 'bg-pink-500', border: 'border-pink-500' };
    case 'teal':
      return { text: 'text-teal-500', bg: 'bg-teal-500', border: 'border-teal-500' };
    case 'amber':
      return { text: 'text-amber-500', bg: 'bg-amber-500', border: 'border-amber-500' };
    case 'rose':
      return { text: 'text-rose-500', bg: 'bg-rose-500', border: 'border-rose-500' };
    default:
      return { text: 'text-ireland-green', bg: 'bg-ireland-green', border: 'border-ireland-green' };
  }
}
