import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { DisplayCurrency } from '@/contexts/CurrencyFilterContext';

interface SummaryCardProps {
  label: string;
  value: number;
  icon?: LucideIcon;
  variant?: 'default' | 'positive' | 'negative' | 'highlight' | 'neutral';
  displayCurrency?: DisplayCurrency;
  className?: string;
}

const CURRENCY_SYMBOLS: Record<DisplayCurrency, string> = {
  BRL: 'R$',
  USD: '$',
  EUR: '€',
};

function formatValue(value: number, currency: DisplayCurrency = 'BRL'): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${symbol} ${formatted}`;
}

export function SummaryCard({ 
  label, 
  value, 
  icon: Icon,
  variant = 'default',
  displayCurrency = 'BRL',
  className 
}: SummaryCardProps) {
  return (
    <div className={cn('summary-card animate-fade-in overflow-hidden', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="summary-label truncate">{label}</span>
        {Icon && (
          <Icon className={cn(
            'h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0',
            variant === 'positive' && 'text-income',
            variant === 'negative' && 'text-expense',
            variant === 'highlight' && 'text-highlight',
            variant === 'neutral' && 'text-muted-foreground',
            variant === 'default' && 'text-primary'
          )} />
        )}
      </div>
      <span className={cn(
        'summary-value break-all',
        variant === 'positive' && 'text-income',
        variant === 'negative' && 'text-expense',
        variant === 'highlight' && 'text-highlight',
        variant === 'neutral' && 'text-foreground',
        variant === 'default' && 'text-foreground'
      )}>
        {formatValue(value, displayCurrency)}
      </span>
    </div>
  );
}
