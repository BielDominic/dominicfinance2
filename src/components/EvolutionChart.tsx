import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, ChevronUp, ChevronDown, Calendar, Filter } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { IncomeEntry, ExpenseCategory } from '@/types/financial';
import { formatCurrency } from '@/utils/formatters';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, addMonths, isWithinInterval, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface EvolutionChartProps {
  incomeEntries: IncomeEntry[];
  expenseCategories: ExpenseCategory[];
}

type DateFilter = 'all' | '6months' | '12months' | 'custom';

export function EvolutionChart({ incomeEntries, expenseCategories }: EvolutionChartProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
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
    
    let minDate = startOfMonth(new Date(Math.min(...dates.map(d => d.getTime()))));
    let maxDate = endOfMonth(addMonths(new Date(), 2)); // Include 2 months ahead for projection
    
    // Apply date filter
    const now = new Date();
    if (dateFilter === '6months') {
      minDate = startOfMonth(subMonths(now, 5));
      maxDate = endOfMonth(addMonths(now, 1));
    } else if (dateFilter === '12months') {
      minDate = startOfMonth(subMonths(now, 11));
      maxDate = endOfMonth(addMonths(now, 1));
    } else if (dateFilter === 'custom' && customRange.from && customRange.to) {
      minDate = startOfMonth(customRange.from);
      maxDate = endOfMonth(customRange.to);
    }
    
    const months = eachMonthOfInterval({ start: minDate, end: maxDate });
    
    let cumulativeIncome = 0;
    
    // Calculate cumulative income up to minDate (for correct starting point)
    if (dateFilter !== 'all') {
      entriesWithDates.forEach(e => {
        try {
          let entryDate: Date;
          if (e.data!.includes('-')) {
            entryDate = parseISO(e.data!);
          } else {
            const parts = e.data!.split('/');
            entryDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          }
          if (isBefore(entryDate, minDate)) {
            cumulativeIncome += e.valor;
          }
        } catch {
          // Skip invalid dates
        }
      });
    }
    
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
  }, [incomeEntries, totalExpenses, dateFilter, customRange]);
  
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
        <div className="flex flex-col gap-4">
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
            <div className="hidden sm:flex items-center gap-4 text-sm">
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

          {/* Mobile Stats */}
          <div className="sm:hidden grid grid-cols-2 gap-2 text-sm">
            <div className="bg-income-light rounded-lg p-2 text-center">
              <p className="text-muted-foreground text-xs">Saldo Atual</p>
              <p className={cn(
                'font-mono font-semibold text-sm',
                currentBalance >= 0 ? 'text-income' : 'text-expense'
              )}>
                {formatCurrency(currentBalance)}
              </p>
            </div>
            <div className="bg-future-light rounded-lg p-2 text-center">
              <p className="text-muted-foreground text-xs">Projeção</p>
              <p className={cn(
                'font-mono font-semibold text-sm flex items-center justify-center gap-1',
                projectedBalance >= 0 ? 'text-future' : 'text-expense'
              )}>
                {projectedBalance > currentBalance ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {formatCurrency(projectedBalance)}
              </p>
            </div>
          </div>

          {/* Date Filter */}
          {isExpanded && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-border overflow-hidden">
                <div className="flex items-center px-2 bg-muted/50 border-r border-border">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                {(['all', '6months', '12months'] as DateFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDateFilter(filter)}
                    className={cn(
                      'px-2 sm:px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                      dateFilter === filter
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted text-muted-foreground'
                    )}
                  >
                    {filter === 'all' ? 'Todos' : 
                     filter === '6months' ? '6 meses' : '12 meses'}
                  </button>
                ))}
              </div>

              {/* Custom Date Range */}
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant={dateFilter === 'custom' ? 'default' : 'outline'} 
                    size="sm" 
                    className="h-8 gap-1 text-xs"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    {dateFilter === 'custom' && customRange.from && customRange.to
                      ? `${format(customRange.from, 'dd/MM')} - ${format(customRange.to, 'dd/MM')}`
                      : 'Personalizado'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    selected={customRange as any}
                    onSelect={(range: any) => {
                      setCustomRange(range || {});
                      if (range?.from && range?.to) {
                        setDateFilter('custom');
                        setIsCalendarOpen(false);
                      }
                    }}
                    numberOfMonths={1}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>
      
      {/* Chart */}
      {isExpanded && (
        <div className="p-4">
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  className="text-xs fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 10 }}
                  width={40}
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
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-future" />
              <span className="text-muted-foreground text-xs sm:text-sm">Entradas Acumuladas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-income" />
              <span className="text-muted-foreground text-xs sm:text-sm">Saldo (Entradas - Saídas)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}