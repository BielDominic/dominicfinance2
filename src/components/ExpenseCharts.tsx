import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ExpenseCategory, Currency } from '@/types/financial';
import { formatCurrency } from '@/utils/formatters';
import { formatCurrencyWithSymbol } from './CurrencySelect';
import { PieChart as PieChartIcon, BarChart3, ChevronDown, ChevronUp, CalendarDays, Filter, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { format, parseISO, isAfter, isBefore, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExpenseChartsProps {
  categories: ExpenseCategory[];
}

type ChartPalette = 'ireland' | 'ocean' | 'sunset' | 'forest' | 'purple' | 'mono';

const COLOR_PALETTES: Record<ChartPalette, string[]> = {
  ireland: [
    'hsl(145, 63%, 32%)',
    'hsl(30, 90%, 50%)',
    'hsl(145, 63%, 45%)',
    'hsl(30, 90%, 60%)',
    'hsl(145, 63%, 25%)',
    'hsl(30, 70%, 45%)',
    'hsl(145, 45%, 55%)',
    'hsl(35, 80%, 55%)',
    'hsl(140, 50%, 40%)',
    'hsl(25, 85%, 52%)',
  ],
  ocean: [
    'hsl(200, 80%, 40%)',
    'hsl(180, 70%, 45%)',
    'hsl(220, 75%, 50%)',
    'hsl(190, 65%, 55%)',
    'hsl(210, 85%, 35%)',
    'hsl(170, 60%, 40%)',
    'hsl(195, 70%, 60%)',
    'hsl(205, 75%, 45%)',
    'hsl(185, 55%, 50%)',
    'hsl(215, 80%, 55%)',
  ],
  sunset: [
    'hsl(15, 85%, 50%)',
    'hsl(35, 90%, 55%)',
    'hsl(350, 80%, 55%)',
    'hsl(25, 95%, 60%)',
    'hsl(5, 75%, 45%)',
    'hsl(45, 85%, 50%)',
    'hsl(330, 70%, 50%)',
    'hsl(20, 80%, 55%)',
    'hsl(355, 75%, 60%)',
    'hsl(40, 90%, 45%)',
  ],
  forest: [
    'hsl(120, 50%, 35%)',
    'hsl(90, 55%, 45%)',
    'hsl(140, 45%, 40%)',
    'hsl(100, 60%, 50%)',
    'hsl(130, 40%, 30%)',
    'hsl(80, 50%, 40%)',
    'hsl(110, 55%, 55%)',
    'hsl(150, 45%, 45%)',
    'hsl(95, 50%, 35%)',
    'hsl(135, 55%, 50%)',
  ],
  purple: [
    'hsl(270, 65%, 50%)',
    'hsl(290, 60%, 55%)',
    'hsl(250, 70%, 45%)',
    'hsl(310, 55%, 50%)',
    'hsl(280, 75%, 40%)',
    'hsl(260, 60%, 55%)',
    'hsl(300, 50%, 45%)',
    'hsl(240, 65%, 50%)',
    'hsl(295, 70%, 55%)',
    'hsl(275, 55%, 45%)',
  ],
  mono: [
    'hsl(0, 0%, 25%)',
    'hsl(0, 0%, 40%)',
    'hsl(0, 0%, 55%)',
    'hsl(0, 0%, 35%)',
    'hsl(0, 0%, 50%)',
    'hsl(0, 0%, 65%)',
    'hsl(0, 0%, 30%)',
    'hsl(0, 0%, 45%)',
    'hsl(0, 0%, 60%)',
    'hsl(0, 0%, 75%)',
  ],
};

type ChartType = 'pie' | 'bar';
type DataView = 'total' | 'pago' | 'falta';
type DateFilter = 'all' | 'thisMonth' | 'nextMonth' | 'next3Months' | 'custom';

export function ExpenseCharts({ categories }: ExpenseChartsProps) {
  const [chartType, setChartType] = useState<ChartType>('pie');
  const [dataView, setDataView] = useState<DataView>('total');
  const [isExpanded, setIsExpanded] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [colorPalette, setColorPalette] = useState<ChartPalette>('ireland');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const COLORS = COLOR_PALETTES[colorPalette];

  const filteredCategories = useMemo(() => {
    if (dateFilter === 'all') return categories;
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    
    if (dateFilter === 'custom') {
      if (!customRange.from || !customRange.to) return categories;
      startDate = customRange.from;
      endDate = customRange.to;
    } else {
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
  }, [categories, dateFilter, customRange]);

  const chartData = filteredCategories
    .filter(cat => cat.categoria && cat.total > 0)
    .map((cat, index) => ({
      name: cat.categoria || 'Sem nome',
      total: cat.total,
      pago: cat.pago,
      falta: cat.faltaPagar,
      moeda: cat.moeda || 'BRL',
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
    const now = new Date();
    switch (dateFilter) {
      case 'all': return 'Todos';
      case 'thisMonth': return format(now, 'MMM yyyy', { locale: ptBR });
      case 'nextMonth': return format(addMonths(now, 1), 'MMM yyyy', { locale: ptBR });
      case 'next3Months': return 'Próx. 3 meses';
      default: return 'Todos';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const moeda = data.moeda || 'BRL';
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-semibold text-foreground">{data.name}</p>
          <div className="mt-1 space-y-1 text-muted-foreground">
            <p>Total: <span className="font-mono text-foreground">{formatCurrencyWithSymbol(data.total, moeda)}</span></p>
            <p>Pago: <span className="font-mono text-income">{formatCurrencyWithSymbol(data.pago, moeda)}</span></p>
            <p>Falta: <span className="font-mono text-expense">{formatCurrencyWithSymbol(data.falta, moeda)}</span></p>
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
                  <Calendar
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

              {/* Color Palette Selector */}
              <Popover open={isPaletteOpen} onOpenChange={setIsPaletteOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                    <Palette className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Cores</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="end">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Paleta de cores</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(COLOR_PALETTES) as ChartPalette[]).map((palette) => (
                        <button
                          key={palette}
                          onClick={() => {
                            setColorPalette(palette);
                            setIsPaletteOpen(false);
                          }}
                          className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-[10px]",
                            colorPalette === palette
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="flex gap-0.5">
                            {COLOR_PALETTES[palette].slice(0, 3).map((color, i) => (
                              <div
                                key={i}
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <span className="capitalize">{palette === 'mono' ? 'Mono' : palette}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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
