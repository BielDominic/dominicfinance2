import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  PiggyBank, 
  Target,
  Euro,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { FinancialSummary as FinancialSummaryType } from '@/types/financial';
import { SummaryCard } from './SummaryCard';

interface FinancialSummaryProps {
  summary: FinancialSummaryType;
}

export function FinancialSummary({ summary }: FinancialSummaryProps) {
  const formatEUR = (value: number) => {
    return `€${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="financial-card p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <Target className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Resumo Final</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total de Entradas"
          value={summary.totalEntradas}
          icon={TrendingUp}
          variant="positive"
        />
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
          label="Total Antecipado"
          value={summary.totalAntecipado}
          icon={PiggyBank}
          variant="highlight"
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
        <div className="bg-ireland-orange/10 rounded-lg p-4 flex flex-col gap-1 ring-2 ring-ireland-orange/30">
          <div className="flex items-center gap-2 text-ireland-orange">
            <Euro className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Saldo em EUR</span>
          </div>
          <span className="font-mono text-xl font-bold text-ireland-orange">
            {formatEUR(summary.saldoAposCambioEUR)}
          </span>
          <span className="text-xs text-muted-foreground">
            Taxa: 1 EUR = R$ {summary.taxaCambio.toFixed(2)}
          </span>
        </div>
        <SummaryCard
          label="Saldo Final Previsto"
          value={summary.saldoFinalPrevisto}
          icon={Target}
          variant="positive"
          className="ring-2 ring-income/30"
        />
      </div>
    </div>
  );
}
