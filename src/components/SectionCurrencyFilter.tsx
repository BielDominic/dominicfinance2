import { useState } from 'react';
import { DollarSign, Euro, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

export type SectionCurrency = 'BRL' | 'USD' | 'EUR' | 'original';

interface SectionCurrencyFilterProps {
  value: SectionCurrency;
  onChange: (currency: SectionCurrency) => void;
  className?: string;
  compact?: boolean;
}

const CURRENCY_OPTIONS: { value: SectionCurrency; label: string; symbol: string; icon?: React.ElementType }[] = [
  { value: 'original', label: 'Original', symbol: '—', icon: Globe },
  { value: 'BRL', label: 'Real', symbol: 'R$' },
  { value: 'USD', label: 'Dólar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
];

export function SectionCurrencyFilter({ value, onChange, className, compact = false }: SectionCurrencyFilterProps) {
  const [open, setOpen] = useState(false);
  const current = CURRENCY_OPTIONS.find(c => c.value === value);

  if (compact) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className={cn("h-7 px-2 text-xs gap-1", className)}>
            <DollarSign className="h-3 w-3" />
            {current?.symbol}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="end">
          <ToggleGroup type="single" value={value} onValueChange={(v) => v && onChange(v as SectionCurrency)} className="flex flex-col gap-1">
            {CURRENCY_OPTIONS.map((option) => (
              <ToggleGroupItem 
                key={option.value} 
                value={option.value}
                className="w-full justify-start gap-2 text-sm"
              >
                <span className="font-mono w-6">{option.symbol}</span>
                <span>{option.label}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 bg-muted/50 rounded-lg p-1", className)}>
      <ToggleGroup type="single" value={value} onValueChange={(v) => v && onChange(v as SectionCurrency)}>
        {CURRENCY_OPTIONS.map((option) => (
          <ToggleGroupItem 
            key={option.value} 
            value={option.value}
            className="h-7 px-2 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm"
          >
            {option.symbol}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

// Utility function to convert values between currencies
export function convertCurrency(
  value: number, 
  fromCurrency: string, 
  toCurrency: SectionCurrency,
  eurRate: number = 6.5,
  usdRate: number = 5.5
): number {
  if (toCurrency === 'original') return value;
  
  // First convert to BRL
  let valueInBRL = value;
  if (fromCurrency === 'EUR') {
    valueInBRL = value * eurRate;
  } else if (fromCurrency === 'USD') {
    valueInBRL = value * usdRate;
  }

  // Then convert from BRL to target currency
  if (toCurrency === 'BRL') return valueInBRL;
  if (toCurrency === 'EUR') return valueInBRL / eurRate;
  if (toCurrency === 'USD') return valueInBRL / usdRate;

  return valueInBRL;
}

export function formatWithCurrency(value: number, currency: SectionCurrency): string {
  const symbols: Record<SectionCurrency, string> = {
    original: '',
    BRL: 'R$',
    USD: '$',
    EUR: '€',
  };
  const symbol = symbols[currency] || '';
  return `${symbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
