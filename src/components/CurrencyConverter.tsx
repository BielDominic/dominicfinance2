import { useState } from 'react';
import { RefreshCw, Euro, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyConverterProps {
  saldoFinal: number;
  saldoAtual: number;
  className?: string;
}

export function CurrencyConverter({ saldoFinal, saldoAtual, className }: CurrencyConverterProps) {
  const [exchangeRate, setExchangeRate] = useState(6.5);

  const saldoFinalEUR = saldoFinal / exchangeRate;
  const saldoAtualEUR = saldoAtual / exchangeRate;

  return (
    <div className={cn('financial-card p-6 animate-fade-in', className)}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-primary" />
          Conversão de Moeda
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">1 EUR =</span>
          <div className="relative">
            <Input
              type="number"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
              className="w-24 h-9 font-mono text-right pr-8"
              step="0.01"
              min="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              R$
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saldo Atual */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Saldo Atual
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">BRL</span>
              <span className="font-mono font-semibold">{formatCurrency(saldoAtual)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-1">
                <Euro className="h-3 w-3" /> EUR
              </span>
              <span className="font-mono font-semibold text-primary">
                €{saldoAtualEUR.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Saldo Final Previsto */}
        <div className="bg-income-light rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-income-foreground">
            <TrendingUp className="h-4 w-4" />
            Saldo Final Previsto
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-income-foreground/80">BRL</span>
              <span className="font-mono font-semibold text-income-foreground">{formatCurrency(saldoFinal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-1 text-income-foreground/80">
                <Euro className="h-3 w-3" /> EUR
              </span>
              <span className="font-mono text-xl font-bold text-income">
                €{saldoFinalEUR.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Taxa de câmbio editável • Valores convertidos automaticamente
        </p>
      </div>
    </div>
  );
}
