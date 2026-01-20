import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ExpenseCategory } from '@/types/financial';
import { formatCurrency } from '@/utils/formatters';
import { PieChart as PieChartIcon, BarChart3, ChevronDown, ChevronUp, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, parseISO, isAfter, isBefore, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExpenseChartsProps {
  categories: ExpenseCategory[];
}

// Ireland theme colors - green and orange variations
const COLORS = [
  'hsl(145, 63%, 32%)',  // ireland-green
  'hsl(30, 90%, 50%)',   // ireland-orange
  'hsl(145, 63%, 45%)',  // ireland-green lighter
  'hsl(30, 90%, 60%)',   // ireland-orange lighter
  'hsl(145, 63%, 25%)',  // ireland-green darker
  'hsl(30, 70%, 45%)',   // ireland-orange darker
  'hsl(145, 45%, 55%)',  // ireland-green muted
  'hsl(35, 80%, 55%)',   // ireland-orange warm
  'hsl(140, 50%, 40%)',  // ireland-green variation
  'hsl(25, 85%, 52%)',   // ireland-orange variation
];

type ChartType = 'pie' | 'bar';
type DataView = 'total' | 'pago' | 'falta';
type DateFilter = 'all' | 'thisMonth' | 'nextMonth' | 'next3Months' | 'custom';

export function ExpenseCharts({ categories }: ExpenseChartsProps) {
  const [chartType, setChartType] = useState<ChartType>('pie');
  const [dataView, setDataView] = useState<DataView>('total');
  const [isExpanded, setIsExpanded] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const today = new Date();
  
  const filteredCategories = useMemo(() => {
    if (dateFilter === 'all') return categories;
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    
    switch (dateFilter) {
      case 'thisMonth':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'nextMonth':
        startDate = startOfMonth(addMonths(now, 1));
        endDate = endOfMonth(addMonths(now, 1));
        break;
      case 'next3Months':
        startDate = startOfMonth(now);
        endDate = endOfMonth(addMonths(now, 2));
        break;
      default:
        return categories;
    }
    
    return categories.filter(cat => {
      if (!cat.vencimento) return false;
      try {
        const catDate = parseISO(cat.vencimento);
        return !isBefore(catDate, startDate) && !isAfter(catDate, endDate);
      } catch {
        return false;
      }
    });
  }, [categories, dateFilter]);

  const chartData = filteredCategories
    .filter(cat => cat.categoria && cat.total > 0)
    .map((cat, index) => ({
      name: cat.categoria || 'Sem nome',
      total: cat.total,
      pago: cat.pago,
      falta: cat.faltaPagar,
      color: COLORS[index % COLORS.length],
    }));

  const getValue = (item: typeof chartData[0]) => {
    switch (dataView) {
      case 'total': return item.total;
      case 'pago': return item.pago;
      case 'falta': return item.falta;
    }
  };

  const getLabel = () => {
    switch (dataView) {
      case 'total': return 'Total';
      case 'pago': return 'Pago';
      case 'falta': return 'Falta Pagar';
    }
  };

  const getFilterLabel = () => {
    switch (dateFilter) {
      case 'all': return 'Todos';
      case 'thisMonth': return format(today, 'MMM yyyy', { locale: ptBR });
      case 'nextMonth': return format(addMonths(today, 1), 'MMM yyyy', { locale: ptBR });
      case 'next3Months': return 'Próx. 3 meses';
      default: return 'Todos';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-semibold text-foreground">{data.name}</p>
          <div className="mt-1 space-y-1 text-muted-foreground">
            <p>Total: <span className="font-mono text-foreground">{formatCurrency(data.total)}</span></p>
            <p>Pago: <span className="font-mono text-income">{formatCurrency(data.pago)}</span></p>
            <p>Falta: <span className="font-mono text-expense">{formatCurrency(data.falta)}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {payload?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1.5 text-xs">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="financial-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-chart-1" />
                Visualização de Gastos
              </h2>
            </button>
          </div>
          
          {isExpanded && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Date Filter */}
              <div className="flex rounded-lg border border-border overflow-hidden">
                <div className="flex items-center px-2 bg-muted/50 border-r border-border">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                {(['all', 'thisMonth', 'nextMonth', 'next3Months'] as DateFilter[]).map((filter) => (
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
                     filter === 'thisMonth' ? 'Este mês' : 
                     filter === 'nextMonth' ? 'Próx. mês' : '3 meses'}
                  </button>
                ))}
              </div>

              {/* Data View Toggle */}
              <div className="flex rounded-lg border border-border overflow-hidden">
                {(['total', 'pago', 'falta'] as DataView[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => setDataView(view)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium transition-colors',
                      dataView === view
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted text-muted-foreground'
                    )}
                  >
                    {view === 'total' ? 'Total' : view === 'pago' ? 'Pago' : 'Falta'}
                  </button>
                ))}
              </div>

              {/* Chart Type Toggle */}
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setChartType('pie')}
                  className={cn(
                    'px-3 py-1.5 flex items-center gap-1 text-xs font-medium transition-colors',
                    chartType === 'pie'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted text-muted-foreground'
                  )}
                >
                  <PieChartIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Pizza</span>
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={cn(
                    'px-3 py-1.5 flex items-center gap-1 text-xs font-medium transition-colors',
                    chartType === 'bar'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted text-muted-foreground'
                  )}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Barras</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart Content */}
      {isExpanded && (
        <div className="p-4">
          {chartData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground">
              Nenhuma despesa com vencimento no período selecionado
            </div>
          ) : (
            <>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey={(item) => getValue(item)}
                        nameKey="name"
                        label={({ name, percent }) => 
                          percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                        }
                        labelLine={false}
                      >
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            stroke="hsl(var(--background))"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend content={<CustomLegend />} />
                    </PieChart>
                  ) : (
                    <BarChart 
                      data={chartData} 
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                    >
                      <XAxis 
                        type="number" 
                        tickFormatter={(value) => formatCurrency(value).replace('R$', '')}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={70}
                        tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey={(item) => getValue(item)} 
                        name={getLabel()}
                        radius={[0, 4, 4, 0]}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Summary */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Previsto</p>
                    <p className="text-sm sm:text-lg font-mono font-semibold">
                      {formatCurrency(chartData.reduce((sum, cat) => sum + cat.total, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Pago</p>
                    <p className="text-sm sm:text-lg font-mono font-semibold text-income">
                      {formatCurrency(chartData.reduce((sum, cat) => sum + cat.pago, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Falta Pagar</p>
                    <p className="text-sm sm:text-lg font-mono font-semibold text-expense">
                      {formatCurrency(chartData.reduce((sum, cat) => sum + cat.falta, 0))}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
