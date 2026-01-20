import { useMemo } from 'react';
import { TrendingUp, Target } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface GlobalProgressBarProps {
  totalEntradas: number;
  totalSaidas: number;
  totalPago: number;
}

export function GlobalProgressBar({ totalEntradas, totalSaidas, totalPago }: GlobalProgressBarProps) {
  const progressPercentage = useMemo(() => {
    if (totalSaidas === 0) return 0;
    return Math.min((totalPago / totalSaidas) * 100, 100);
  }, [totalSaidas, totalPago]);

  const saldoDisponivel = totalEntradas - totalSaidas;

  return (
    <div className="financial-card p-4 mb-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Progress Section */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">Progresso do Pagamento</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {formatCurrency(totalPago)} de {formatCurrency(totalSaidas)}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-6 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                "bg-gradient-to-r from-income to-income/80"
              )}
              style={{ width: `${progressPercentage}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-foreground drop-shadow-sm">
                {progressPercentage.toFixed(1)}% Pago
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 lg:gap-6">
          <div className="text-center px-4 py-2 bg-income-light rounded-lg">
            <p className="text-xs text-muted-foreground">Total Entradas</p>
            <p className="font-mono font-bold text-income">{formatCurrency(totalEntradas)}</p>
          </div>
          <div className="text-center px-4 py-2 bg-expense-light rounded-lg">
            <p className="text-xs text-muted-foreground">Total Saídas</p>
            <p className="font-mono font-bold text-expense">{formatCurrency(totalSaidas)}</p>
          </div>
          <div className="text-center px-4 py-2 bg-highlight-light rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3 text-highlight" />
              <p className="text-xs text-muted-foreground">Saldo</p>
            </div>
            <p className="font-mono font-bold text-highlight">{formatCurrency(saldoDisponivel)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
