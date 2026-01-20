import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, ChevronUp, ChevronDown, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { IncomeEntry, ExpenseCategory } from '@/types/financial';
import { formatCurrency } from '@/utils/formatters';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, addMonths, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EvolutionChartProps {
  incomeEntries: IncomeEntry[];
  expenseCategories: ExpenseCategory[];
}

export function EvolutionChart({ incomeEntries, expenseCategories }: EvolutionChartProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const totalExpenses = expenseCategories.reduce((sum, c) => sum + c.total, 0);
  
  const chartData = useMemo(() => {
    // Get all dates from income entries
    const entriesWithDates = incomeEntries.filter(e => e.data && e.status === 'Entrada');
    
    if (entriesWithDates.length === 0) {
      // Return placeholder data if no entries
      const now = new Date();
      return [
        { month: format(subMonths(now, 2), 'MMM yy', { locale: ptBR }), entradas: 0, saldo: 0 },
        { month: format(subMonths(now, 1), 'MMM yy', { locale: ptBR }), entradas: 0, saldo: 0 },
        { month: format(now, 'MMM yy', { locale: ptBR }), entradas: 0, saldo: 0 },
      ];
    }
    
    // Find date range
    const dates = entriesWithDates.map(e => {
      try {
        // Handle different date formats
        if (e.data!.includes('-')) {
          return parseISO(e.data!);
        }
        // Handle DD/MM/YYYY format
        const parts = e.data!.split('/');
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      } catch {
        return new Date();
      }
    });
    
    const minDate = startOfMonth(new Date(Math.min(...dates.map(d => d.getTime()))));
    const maxDate = endOfMonth(addMonths(new Date(), 2)); // Include 2 months ahead for projection
    
    const months = eachMonthOfInterval({ start: minDate, end: maxDate });
    
    let cumulativeIncome = 0;
    
    return months.map(monthDate => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      // Sum income for this month
      const monthIncome = entriesWithDates
        .filter(e => {
          try {
            let entryDate: Date;
            if (e.data!.includes('-')) {
              entryDate = parseISO(e.data!);
            } else {
              const parts = e.data!.split('/');
              entryDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
            return isWithinInterval(entryDate, { start: monthStart, end: monthEnd });
          } catch {
            return false;
          }
        })
        .reduce((sum, e) => sum + e.valor, 0);
      
      cumulativeIncome += monthIncome;
      
      const isFuture = monthDate > new Date();
      
      return {
        month: format(monthDate, 'MMM yy', { locale: ptBR }),
        entradas: monthIncome,
        acumulado: cumulativeIncome,
        saldo: cumulativeIncome - totalExpenses,
        isFuture,
      };
    });
  }, [incomeEntries, totalExpenses]);
  
  const currentBalance = chartData.length > 0 
    ? chartData.filter(d => !(d as any).isFuture).slice(-1)[0]?.saldo ?? 0
    : 0;
  
  const projectedBalance = chartData.length > 0 
    ? chartData.slice(-1)[0]?.saldo ?? 0 
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-income">
              Entradas: {formatCurrency(payload[0]?.payload?.entradas ?? 0)}
            </p>
            <p className="text-muted-foreground">
              Acumulado: {formatCurrency(payload[0]?.payload?.acumulado ?? 0)}
            </p>
            <p className={cn(
              'font-semibold',
              (payload[0]?.payload?.saldo ?? 0) >= 0 ? 'text-income' : 'text-expense'
            )}>
              Saldo: {formatCurrency(payload[0]?.payload?.saldo ?? 0)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="financial-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left w-full"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
          <div className="flex-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-future" />
              Evolução Temporal
            </h2>
            <p className="text-sm text-muted-foreground">
              Acompanhamento do saldo ao longo do tempo
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <p className="text-muted-foreground text-xs">Saldo Atual</p>
              <p className={cn(
                'font-mono font-semibold',
                currentBalance >= 0 ? 'text-income' : 'text-expense'
              )}>
                {formatCurrency(currentBalance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-xs">Projeção</p>
              <p className={cn(
                'font-mono font-semibold flex items-center gap-1',
                projectedBalance >= 0 ? 'text-future' : 'text-expense'
              )}>
                {projectedBalance > currentBalance ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {formatCurrency(projectedBalance)}
              </p>
            </div>
          </div>
        </button>
      </div>
      
      {/* Chart */}
      {isExpanded && (
        <div className="p-4">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--income))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--income))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--future))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--future))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  className="text-xs fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="acumulado"
                  stroke="hsl(var(--future))"
                  fillOpacity={1}
                  fill="url(#colorAcumulado)"
                  strokeWidth={2}
                  name="Acumulado"
                />
                <Area
                  type="monotone"
                  dataKey="saldo"
                  stroke="hsl(var(--income))"
                  fillOpacity={1}
                  fill="url(#colorSaldo)"
                  strokeWidth={2}
                  name="Saldo"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-future" />
              <span className="text-muted-foreground">Entradas Acumuladas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-income" />
              <span className="text-muted-foreground">Saldo (Entradas - Saídas)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
