import { useState } from 'react';
import { RefreshCw, Euro, TrendingUp, Percent, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface CurrencyConverterProps {
  saldoFinal: number;
  saldoAtual: number;
  exchangeRate: number;
  onExchangeRateChange: (rate: number) => void;
  spread: number;
  onSpreadChange: (spread: number) => void;
  className?: string;
}

export function CurrencyConverter({ 
  saldoFinal, 
  saldoAtual, 
  exchangeRate,
  onExchangeRateChange,
  spread,
  onSpreadChange,
  className 
}: CurrencyConverterProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Taxa efetiva = taxa base + spread
  const effectiveRate = exchangeRate * (1 + spread / 100);
  
  const saldoFinalEUR = saldoFinal / effectiveRate;
  const saldoAtualEUR = saldoAtual / effectiveRate;

  const spreadPresets = [0, 1, 2, 3, 4, 5];

  return (
    <div className={cn('financial-card overflow-hidden animate-fade-in', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Conversão de Moeda
              </h2>
              <p className="text-sm text-muted-foreground">
                Taxa: R$ {effectiveRate.toFixed(2)} • Spread: {spread}%
              </p>
            </div>
          </button>
          
          {isExpanded && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">1 EUR =</span>
              <div className="relative">
                <Input
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => onExchangeRateChange(parseFloat(e.target.value) || 0)}
                  className="w-24 h-9 font-mono text-right pr-8"
                  step="0.01"
                  min="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  R$
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Spread Selector */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Percent className="h-4 w-4 text-ireland-orange" />
                Spread da Corretora
              </div>
              <span className="font-mono text-lg font-bold text-ireland-orange">
                {spread.toFixed(1)}%
              </span>
            </div>
            
            {/* Preset buttons */}
            <div className="flex gap-2 flex-wrap">
              {spreadPresets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => onSpreadChange(preset)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                    spread === preset
                      ? 'bg-ireland-orange text-white'
                      : 'bg-background border border-border hover:bg-muted'
                  )}
                >
                  {preset}%
                </button>
              ))}
            </div>
            
            {/* Slider for fine control */}
            <div className="pt-2">
              <Slider
                value={[spread]}
                onValueChange={(values) => onSpreadChange(values[0])}
                min={0}
                max={10}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span>10%</span>
              </div>
            </div>
            
            {/* Effective rate display */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">Taxa efetiva com spread:</span>
              <span className="font-mono font-semibold text-ireland-green">
                1 EUR = R$ {effectiveRate.toFixed(4)}
              </span>
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

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Taxa de câmbio editável • Spread ajustável • Valores convertidos automaticamente
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
