import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Target, Goal, ChevronDown, ChevronUp, Wallet, Sparkles } from 'lucide-react';
import { parseCurrencyInput } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useCurrencyFilter } from '@/contexts/CurrencyFilterContext';

interface GlobalProgressBarProps {
  totalEntradas: number;
  totalSaidas: number;
  totalPago: number;
  totalFuturos: number;
  metaEntradas: number;
  onMetaChange: (value: number) => void;
  exchangeRate?: number;
}

export function GlobalProgressBar({
  totalEntradas,
  totalSaidas,
  totalPago,
  totalFuturos,
  metaEntradas,
  onMetaChange,
  exchangeRate = 6.5
}: GlobalProgressBarProps) {
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [metaInput, setMetaInput] = useState(metaEntradas.toString());
  const [isExpanded, setIsExpanded] = useState(true);
  const { convertValue, formatWithSymbol } = useCurrencyFilter();
  
  // Convert values to display currency
  const converted = useMemo(() => ({
    totalEntradas: convertValue(totalEntradas, 'BRL', exchangeRate),
    totalSaidas: convertValue(totalSaidas, 'BRL', exchangeRate),
    totalPago: convertValue(totalPago, 'BRL', exchangeRate),
    totalFuturos: convertValue(totalFuturos, 'BRL', exchangeRate),
    metaEntradas: convertValue(metaEntradas, 'BRL', exchangeRate),
  }), [totalEntradas, totalSaidas, totalPago, totalFuturos, metaEntradas, exchangeRate, convertValue]);

  const progressPercentage = useMemo(() => {
    if (totalSaidas === 0) return 0;
    return Math.min(totalPago / totalSaidas * 100, 100);
  }, [totalSaidas, totalPago]);
  
  const entradasPercentage = useMemo(() => {
    if (metaEntradas === 0) return 0;
    return Math.min(totalEntradas / metaEntradas * 100, 100);
  }, [totalEntradas, metaEntradas]);
  
  const saldoDisponivel = converted.totalEntradas - converted.totalSaidas;
  const saldoComFuturos = converted.totalEntradas + converted.totalFuturos - converted.totalSaidas;
  const faltaDepositar = totalSaidas - totalEntradas; // Keep original for visibility check
  const faltaDepositarConverted = converted.totalSaidas - converted.totalEntradas;
  const faltaDepositarComFuturosConverted = converted.totalSaidas - (converted.totalEntradas + converted.totalFuturos);
  const totalAPagar = converted.totalSaidas - converted.totalPago;
  const totalAPagarComFuturos = totalAPagar + converted.totalFuturos;
  
  const handleMetaSubmit = () => {
    const value = parseCurrencyInput(metaInput);
    onMetaChange(value);
    setIsEditingMeta(false);
  };
  return <div className="financial-card mb-6 animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 hover:opacity-80 transition-opacity w-full text-left">
          {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
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

      {isExpanded && <div className="p-4 space-y-4">
          {/* Meta de Entradas Section */}
          <div className="pb-4 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Goal className="h-5 w-5 text-highlight" />
                <span className="font-semibold text-sm">Meta de Entradas</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  <span className="font-mono">{formatWithSymbol(converted.totalEntradas)}</span> de
                </span>
                {isEditingMeta ? <Input type="text" value={metaInput} onChange={e => setMetaInput(e.target.value)} onBlur={handleMetaSubmit} onKeyDown={e => {
              if (e.key === 'Enter') handleMetaSubmit();
              if (e.key === 'Escape') {
                setMetaInput(metaEntradas.toString());
                setIsEditingMeta(false);
              }
            }} className="w-28 h-7 text-right font-mono text-sm" autoFocus /> : <button onClick={() => {
              setMetaInput(metaEntradas.toString());
              setIsEditingMeta(true);
            }} className="font-mono font-bold text-highlight hover:underline cursor-pointer">
                    {formatWithSymbol(converted.metaEntradas)}
                  </button>}
              </div>
            </div>
            
            {/* Meta Progress Bar */}
            <div className="relative h-6 bg-muted rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-500 ease-out", "bg-gradient-to-r from-highlight to-highlight/80")} style={{
            width: `${entradasPercentage}%`
          }} />
              <div className="absolute inset-0 flex items-center justify-center opacity-100">
                <span className="text-xs font-bold text-foreground drop-shadow-sm">
                  {entradasPercentage.toFixed(1)}% da Meta
                </span>
              </div>
            </div>
          </div>

          {/* Payment Progress Section */}
          <div className="pb-4 border-b border-border sm:border-b-0 sm:pb-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">Progresso do Pagamento</span>
              </div>
              <span className="text-sm text-muted-foreground">
                <span className="font-mono">{formatWithSymbol(converted.totalPago)}</span> de <span className="font-mono">{formatWithSymbol(converted.totalSaidas)}</span>
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-6 bg-muted rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-500 ease-out", "bg-gradient-to-r from-income to-income/80")} style={{
            width: `${progressPercentage}%`
          }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-foreground drop-shadow-sm">
                  {progressPercentage.toFixed(1)}% Pago
                </span>
              </div>
            </div>
          </div>

          {/* Stats Row 1 - Main indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
            <div className="text-center p-2 sm:px-4 sm:py-3 bg-income-light rounded-lg">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Total Entradas</p>
              <p className="font-mono font-bold text-income text-xs sm:text-base">{formatWithSymbol(converted.totalEntradas)}</p>
            </div>
            <div className="text-center p-2 sm:px-4 sm:py-3 bg-future-light rounded-lg border border-future/20">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Entradas + Futuros</p>
              <p className="font-mono font-bold text-future text-xs sm:text-base">{formatWithSymbol(converted.totalEntradas + converted.totalFuturos)}</p>
            </div>
            <div className="text-center p-2 sm:px-4 sm:py-3 bg-expense-light rounded-lg">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Total Saídas</p>
              <p className="font-mono font-bold text-expense text-xs sm:text-base">{formatWithSymbol(converted.totalSaidas)}</p>
            </div>
            <div className="text-center p-2 sm:px-4 sm:py-3 bg-highlight-light rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-highlight" />
                <p className="text-[10px] sm:text-xs text-muted-foreground">Saldo</p>
              </div>
              <p className={cn("font-mono font-bold text-xs sm:text-base", saldoDisponivel >= 0 ? 'text-highlight' : 'text-expense')}>{formatWithSymbol(saldoDisponivel)}</p>
            </div>
            <div className="text-center p-2 sm:px-4 sm:py-3 bg-future-light rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Sparkles className="h-3 w-3 text-future" />
                <p className="text-[10px] sm:text-xs text-muted-foreground">Com Futuros</p>
              </div>
              <p className={cn("font-mono font-bold text-xs sm:text-base", saldoComFuturos >= 0 ? 'text-future' : 'text-expense')}>{formatWithSymbol(saldoComFuturos)}</p>
            </div>
          </div>

          {/* Stats Row 2 - Total a pagar indicators */}
          <div className="mt-3 pt-3 border-t border-border">
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-expense-light rounded-lg border border-expense/20">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingDown className="h-3 w-3 text-expense" />
                  <p className="text-xs text-muted-foreground">Total a Pagar</p>
                </div>
                <p className="font-mono font-bold text-expense text-lg sm:text-xl">{formatWithSymbol(totalAPagar)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Despesas não pagas</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-future-light rounded-lg border border-future/20">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Wallet className="h-3 w-3 text-future" />
                  <p className="text-xs text-muted-foreground">A Pagar (com Futuros)</p>
                </div>
                <p className={cn("font-mono font-bold text-lg sm:text-xl", totalAPagarComFuturos > 0 ? 'text-future' : 'text-income')}>
                  {totalAPagarComFuturos > 0 ? formatWithSymbol(totalAPagarComFuturos) : formatWithSymbol(Math.abs(totalAPagarComFuturos)) + ' ✓'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Falta - Futuros</p>
              </div>
            </div>
          </div>

          {/* Falta Depositar Section */}
          {faltaDepositar > 0 && <div className="mt-3 pt-3 border-t border-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <div className="text-center p-3 sm:p-4 bg-expense-light rounded-lg border border-expense/20">
                  <p className="text-xs text-muted-foreground mb-1">Falta Depositar</p>
                  <p className="font-mono font-bold text-expense text-lg sm:text-xl">{formatWithSymbol(faltaDepositarConverted)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Saídas - Entradas</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-future-light rounded-lg border border-future/20">
                  <p className="text-xs text-muted-foreground mb-1">Falta (com Futuros)</p>
                  <p className={cn("font-mono font-bold text-lg sm:text-xl", faltaDepositarComFuturosConverted > 0 ? 'text-future' : 'text-income')}>
                    {faltaDepositarComFuturosConverted > 0 ? formatWithSymbol(faltaDepositarComFuturosConverted) : formatWithSymbol(Math.abs(faltaDepositarComFuturosConverted)) + ' ✓'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">Saídas - (Entradas + Futuros)</p>
                </div>
              </div>
            </div>}
        </div>}
    </div>;
}