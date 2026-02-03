import { useCurrencyFilter, DisplayCurrency } from '@/contexts/CurrencyFilterContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DollarSign, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const CURRENCY_OPTIONS: { value: DisplayCurrency; label: string; symbol: string }[] = [
  { value: 'ALL', label: 'Todos', symbol: '—' },
  { value: 'BRL', label: 'Real', symbol: 'R$' },
  { value: 'USD', label: 'Dólar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
];

interface CurrencyFilterSelectProps {
  className?: string;
  compact?: boolean;
}

export function CurrencyFilterSelect({ className, compact = false }: CurrencyFilterSelectProps) {
  const { displayCurrency, setDisplayCurrency, resetFilter } = useCurrencyFilter();

  const currentCurrency = CURRENCY_OPTIONS.find(c => c.value === displayCurrency);
  const isFiltered = displayCurrency !== 'ALL';

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={displayCurrency} onValueChange={(value) => setDisplayCurrency(value as DisplayCurrency)}>
        <SelectTrigger className={compact ? "w-[90px] h-8 text-xs" : "w-[130px]"}>
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
                <span className="font-mono w-6">{option.symbol}</span>
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {isFiltered && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetFilter}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
