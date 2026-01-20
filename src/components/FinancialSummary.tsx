import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  Target,
  Euro,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { FinancialSummary as FinancialSummaryType } from '@/types/financial';
import { SummaryCard } from './SummaryCard';
import { formatCurrency } from '@/utils/formatters';

interface FinancialSummaryProps {
  summary: FinancialSummaryType;
}

export function FinancialSummary({ summary }: FinancialSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const formatEUR = (value: number) => {
    return `€${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="financial-card overflow-hidden animate-fade-in">
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
              Resumo Final
            </h2>
            <p className="text-sm text-muted-foreground">
              Visão geral das finanças
            </p>
          </div>
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <SummaryCard
              label="Total de Entradas"
              value={summary.totalEntradas}
              icon={TrendingUp}
              variant="positive"
            />
            <div className="bg-future-light rounded-lg p-3 sm:p-4 flex flex-col gap-1 ring-2 ring-future/30">
              <div className="flex items-center gap-2 text-future">
                <TrendingUp className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs font-medium uppercase tracking-wide">Entradas + Futuros</span>
              </div>
              <span className="font-mono text-lg sm:text-xl font-bold text-future">
                {formatCurrency(summary.totalEntradas + summary.totalFuturos)}
              </span>
              <span className="text-xs text-muted-foreground">
                Total combinado
              </span>
            </div>
            <SummaryCard
              label="Total de Saídas"
              value={summary.totalSaidas}
              icon={TrendingDown}
              variant="negative"
            />
            <SummaryCard
              label="Total Pago"
              value={summary.totalPago}
              icon={CheckCircle2}
              variant="positive"
            />
            <SummaryCard
              label="Total a Pagar"
              value={summary.totalAPagar}
              icon={CreditCard}
              variant="negative"
            />
            <SummaryCard
              label="Total Futuros"
              value={summary.totalFuturos}
              icon={Clock}
              variant="default"
            />
            <SummaryCard
              label="Saldo Atual"
              value={summary.saldoAtual}
              icon={Wallet}
              variant="neutral"
            />
            <SummaryCard
              label="Saldo Final Previsto"
              value={summary.saldoFinalPrevisto}
              icon={Target}
              variant="positive"
            />
            <div className="bg-future-light rounded-lg p-3 sm:p-4 flex flex-col gap-1 ring-2 ring-future/30">
              <div className="flex items-center gap-2 text-future">
                <Sparkles className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs font-medium uppercase tracking-wide">Com Futuros</span>
              </div>
              <span className="font-mono text-lg sm:text-xl font-bold text-future">
                {formatCurrency(summary.saldoFinalComFuturos)}
              </span>
              <span className="text-xs text-muted-foreground">
                Entradas + Futuros - Saídas
              </span>
            </div>
          </div>

          {/* EUR Conversion Summary */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-ireland-orange/10 rounded-lg p-3 sm:p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-ireland-orange">
                  <Euro className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs font-medium uppercase tracking-wide">Saldo em EUR</span>
                </div>
                <span className="font-mono text-lg sm:text-xl font-bold text-ireland-orange">
                  {formatEUR(summary.saldoAposCambioEUR)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Saldo Final Previsto
                </span>
              </div>
              <div className="bg-future-light rounded-lg p-3 sm:p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-future">
                  <Euro className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs font-medium uppercase tracking-wide">EUR com Futuros</span>
                </div>
                <span className="font-mono text-lg sm:text-xl font-bold text-future">
                  {formatEUR(summary.saldoFinalComFuturos / summary.taxaCambio)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Taxa: 1 EUR = R$ {summary.taxaCambio.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
