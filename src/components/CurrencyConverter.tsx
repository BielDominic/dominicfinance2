import { useState } from 'react';
import { RefreshCw, Euro, TrendingUp, Percent, ChevronDown, ChevronUp, Wifi, WifiOff, Loader2, Check } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CurrencyConverterProps {
  saldoFinal: number;
  saldoFinalComFuturos: number;
  saldoAtual: number;
  exchangeRate: number;
  onExchangeRateChange: (rate: number) => void;
  spread: number;
  onSpreadChange: (spread: number) => void;
  className?: string;
}

export function CurrencyConverter({ 
  saldoFinal, 
  saldoFinalComFuturos,
  saldoAtual, 
  exchangeRate,
  onExchangeRateChange,
  spread,
  onSpreadChange,
  className 
}: CurrencyConverterProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { rate: liveRate, lastUpdated, isLoading: isLoadingRate, error: rateError, refetch } = useExchangeRate('EUR', 'BRL');
  
  // Taxa efetiva = taxa base + spread
  const effectiveRate = exchangeRate * (1 + spread / 100);
  
  const saldoFinalEUR = saldoFinal / effectiveRate;
  const saldoFinalComFuturosEUR = saldoFinalComFuturos / effectiveRate;
  const saldoAtualEUR = saldoAtual / effectiveRate;

  const spreadPresets = [0, 1, 2, 3, 4, 5];

  const handleUseLiveRate = () => {
    if (liveRate > 0) {
      onExchangeRateChange(parseFloat(liveRate.toFixed(4)));
    }
  };

  const isUsingLiveRate = liveRate > 0 && Math.abs(exchangeRate - liveRate) < 0.01;

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn('financial-card overflow-hidden animate-fade-in', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between gap-4">
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
            <div className="flex items-center gap-3 flex-wrap justify-end">
              {/* Live Rate Indicator */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                      liveRate > 0 && !rateError
                        ? 'bg-ireland-green/10 text-ireland-green'
                        : 'bg-destructive/10 text-destructive'
                    )}>
                      {isLoadingRate ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : liveRate > 0 && !rateError ? (
                        <Wifi className="h-3 w-3" />
                      ) : (
                        <WifiOff className="h-3 w-3" />
                      )}
                      <span>
                        {isLoadingRate 
                          ? 'Buscando...' 
                          : liveRate > 0 
                            ? `Tempo real: R$ ${liveRate.toFixed(4)}`
                            : 'Offline'
                        }
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {lastUpdated 
                      ? `Atualizado às ${formatLastUpdated(lastUpdated)}`
                      : rateError || 'Cotação em tempo real via Frankfurter API'
                    }
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Use Live Rate Button */}
              {liveRate > 0 && !isUsingLiveRate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUseLiveRate}
                  className="gap-1.5 text-xs h-8"
                >
                  <Check className="h-3 w-3" />
                  Usar cotação atual
                </Button>
              )}

              {/* Refresh Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={refetch}
                disabled={isLoadingRate}
                className="h-8 w-8"
              >
                <RefreshCw className={cn('h-4 w-4', isLoadingRate && 'animate-spin')} />
              </Button>

              {/* Manual Input */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">1 EUR =</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

            {/* Saldo com Futuros */}
            <div className="bg-future-light rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-future-foreground">
                <TrendingUp className="h-4 w-4" />
                Com Futuros
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-future-foreground/80">BRL</span>
                  <span className="font-mono font-semibold text-future-foreground">{formatCurrency(saldoFinalComFuturos)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1 text-future-foreground/80">
                    <Euro className="h-3 w-3" /> EUR
                  </span>
                  <span className="font-mono text-xl font-bold text-future">
                    €{saldoFinalComFuturosEUR.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
