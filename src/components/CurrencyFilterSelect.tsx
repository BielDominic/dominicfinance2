import { useCurrencyFilter, DisplayCurrency } from '@/contexts/CurrencyFilterContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign } from 'lucide-react';

const CURRENCY_OPTIONS: { value: DisplayCurrency; label: string; symbol: string }[] = [
  { value: 'BRL', label: 'Real', symbol: 'R$' },
  { value: 'USD', label: 'Dólar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
];

interface CurrencyFilterSelectProps {
  className?: string;
  compact?: boolean;
}

export function CurrencyFilterSelect({ className, compact = false }: CurrencyFilterSelectProps) {
  const { displayCurrency, setDisplayCurrency } = useCurrencyFilter();

  const currentCurrency = CURRENCY_OPTIONS.find(c => c.value === displayCurrency);

  return (
    <div className={className}>
      <Select value={displayCurrency} onValueChange={(value) => setDisplayCurrency(value as DisplayCurrency)}>
        <SelectTrigger className={compact ? "w-[80px] h-8 text-xs" : "w-[120px]"}>
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <SelectValue>
              {compact ? currentCurrency?.symbol : currentCurrency?.label}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {CURRENCY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <span className="font-mono">{option.symbol}</span>
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
