import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BudgetAlertProps {
  total: number;
  meta: number | null;
}

export function BudgetAlert({ total, meta }: BudgetAlertProps) {
  if (!meta || meta === 0) return null;
  
  const percentage = (total / meta) * 100;
  const isOverBudget = percentage >= 100;
  const isNearBudget = percentage >= 80 && percentage < 100;
  
  if (percentage < 80) {
    return (
      <div className="flex items-center gap-1 text-income text-xs">
        <CheckCircle2 className="h-3 w-3" />
        <span>{percentage.toFixed(0)}%</span>
      </div>
    );
  }
  
  return (
    <div className={cn(
      'flex items-center gap-1 text-xs font-medium animate-pulse',
      isOverBudget ? 'text-expense' : 'text-yellow-600 dark:text-yellow-400'
    )}>
      <AlertTriangle className="h-3 w-3" />
      <span>
        {isOverBudget ? 'Acima do orçamento!' : `${percentage.toFixed(0)}% do orçamento`}
      </span>
    </div>
  );
}
