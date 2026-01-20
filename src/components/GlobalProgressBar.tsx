import { useState, useMemo } from 'react';
import { TrendingUp, Target, Goal, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, parseCurrencyInput } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface GlobalProgressBarProps {
  totalEntradas: number;
  totalSaidas: number;
  totalPago: number;
  metaEntradas: number;
  onMetaChange: (value: number) => void;
}

export function GlobalProgressBar({ 
  totalEntradas, 
  totalSaidas, 
  totalPago, 
  metaEntradas,
  onMetaChange 
}: GlobalProgressBarProps) {
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [metaInput, setMetaInput] = useState(metaEntradas.toString());
  const [isExpanded, setIsExpanded] = useState(true);

  const progressPercentage = useMemo(() => {
    if (totalSaidas === 0) return 0;
    return Math.min((totalPago / totalSaidas) * 100, 100);
  }, [totalSaidas, totalPago]);

  const entradasPercentage = useMemo(() => {
    if (metaEntradas === 0) return 0;
    return Math.min((totalEntradas / metaEntradas) * 100, 100);
  }, [totalEntradas, metaEntradas]);

  const saldoDisponivel = totalEntradas - totalSaidas;

  const handleMetaSubmit = () => {
    const value = parseCurrencyInput(metaInput);
    onMetaChange(value);
    setIsEditingMeta(false);
  };

  return (
    <div className="financial-card mb-6 animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity w-full text-left"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Progresso Geral
            </h2>
            <p className="text-sm text-muted-foreground">
              Meta e progresso de pagamentos
            </p>
          </div>
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Meta de Entradas Section */}
          <div className="pb-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Goal className="h-5 w-5 text-highlight" />
                <span className="font-semibold text-sm">Meta de Entradas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(totalEntradas)} de
                </span>
                {isEditingMeta ? (
                  <Input
                    type="text"
                    value={metaInput}
                    onChange={(e) => setMetaInput(e.target.value)}
                    onBlur={handleMetaSubmit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleMetaSubmit();
                      if (e.key === 'Escape') {
                        setMetaInput(metaEntradas.toString());
                        setIsEditingMeta(false);
                      }
                    }}
                    className="w-32 h-7 text-right font-mono text-sm"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => {
                      setMetaInput(metaEntradas.toString());
                      setIsEditingMeta(true);
                    }}
                    className="font-mono font-bold text-highlight hover:underline cursor-pointer"
                  >
                    {formatCurrency(metaEntradas)}
                  </button>
                )}
              </div>
            </div>
            
            {/* Meta Progress Bar */}
            <div className="relative h-6 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out",
                  "bg-gradient-to-r from-highlight to-highlight/80"
                )}
                style={{ width: `${entradasPercentage}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-foreground drop-shadow-sm">
                  {entradasPercentage.toFixed(1)}% da Meta
                </span>
              </div>
            </div>
          </div>

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
      )}
    </div>
  );
}
