import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  PiggyBank, 
  Target,
  ArrowRightLeft,
  CheckCircle2
} from 'lucide-react';
import { FinancialSummary as FinancialSummaryType } from '@/types/financial';
import { SummaryCard } from './SummaryCard';

interface FinancialSummaryProps {
  summary: FinancialSummaryType;
}

export function FinancialSummary({ summary }: FinancialSummaryProps) {
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
          label="Saldo Atual"
          value={summary.saldoAtual}
          icon={Wallet}
          variant="neutral"
        />
        <SummaryCard
          label="Saldo Após Câmbio"
          value={summary.saldoAposCambio}
          icon={ArrowRightLeft}
          variant="default"
        />
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
