import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  label: string;
  value: number;
  icon?: LucideIcon;
  variant?: 'default' | 'positive' | 'negative' | 'highlight' | 'neutral';
  currency?: 'BRL' | 'EUR';
  className?: string;
}

export function SummaryCard({ 
  label, 
  value, 
  icon: Icon,
  variant = 'default',
  currency = 'BRL',
  className 
}: SummaryCardProps) {
  return (
    <div className={cn('summary-card animate-fade-in', className)}>
      <div className="flex items-center justify-between">
        <span className="summary-label">{label}</span>
        {Icon && (
          <Icon className={cn(
            'h-5 w-5',
            variant === 'positive' && 'text-income',
            variant === 'negative' && 'text-expense',
            variant === 'highlight' && 'text-highlight',
            variant === 'neutral' && 'text-muted-foreground',
            variant === 'default' && 'text-primary'
          )} />
        )}
      </div>
      <span className={cn(
        'summary-value',
        variant === 'positive' && 'text-income',
        variant === 'negative' && 'text-expense',
        variant === 'highlight' && 'text-highlight',
        variant === 'neutral' && 'text-foreground',
        variant === 'default' && 'text-foreground'
      )}>
        {formatCurrency(value, currency)}
      </span>
    </div>
  );
}
