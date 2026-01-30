import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type Currency = 'BRL' | 'EUR' | 'USD';

interface CurrencySelectProps {
  value: Currency;
  onChange: (currency: Currency) => void;
  className?: string;
  compact?: boolean;
}

const currencySymbols: Record<Currency, string> = {
  BRL: 'R$',
  EUR: '€',
  USD: '$',
};

const currencyLabels: Record<Currency, string> = {
  BRL: 'Real (R$)',
  EUR: 'Euro (€)',
  USD: 'Dólar ($)',
};

export function CurrencySelect({ value, onChange, className, compact = false }: CurrencySelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Currency)}>
      <SelectTrigger 
        className={cn(
          "font-mono bg-background border-border",
          compact ? "h-7 w-16 text-xs px-2" : "h-8 w-20 text-sm",
          className
        )}
      >
        <SelectValue>
          {compact ? currencySymbols[value] : value}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-popover border shadow-lg z-50 min-w-[120px]">
        <SelectItem value="BRL" className="font-mono">
          <span className="flex items-center gap-2">
            <span className="w-6">R$</span>
            <span className="text-muted-foreground text-xs">Real</span>
          </span>
        </SelectItem>
        <SelectItem value="EUR" className="font-mono">
          <span className="flex items-center gap-2">
            <span className="w-6">€</span>
            <span className="text-muted-foreground text-xs">Euro</span>
          </span>
        </SelectItem>
        <SelectItem value="USD" className="font-mono">
          <span className="flex items-center gap-2">
            <span className="w-6">$</span>
            <span className="text-muted-foreground text-xs">Dólar</span>
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

export function getCurrencySymbol(currency: Currency): string {
  return currencySymbols[currency] || 'R$';
}

export function formatCurrencyWithSymbol(value: number, currency: Currency = 'BRL'): string {
  const symbol = currencySymbols[currency];
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${symbol} ${formatted}`;
}
