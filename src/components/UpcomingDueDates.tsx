import { useState, useMemo } from 'react';
import { 
  CalendarClock, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { ExpenseCategory, Currency } from '@/types/financial';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { PersonBadge } from './PersonBadge';
import { formatCurrencyWithSymbol } from './CurrencySelect';
import { cn } from '@/lib/utils';
import { differenceInDays, parseISO, isValid } from 'date-fns';

interface UpcomingDueDatesProps {
  expenseCategories: ExpenseCategory[];
}

interface DueItem {
  id: string;
  categoria: string;
  faltaPagar: number;
  vencimento: string;
  pessoa: ExpenseCategory['pessoa'];
  moeda: Currency;
  daysUntilDue: number;
  status: 'overdue' | 'urgent' | 'soon' | 'normal';
}

export function UpcomingDueDates({ expenseCategories }: UpcomingDueDatesProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const upcomingDues = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dues: DueItem[] = expenseCategories
      .filter(c => c.vencimento && c.faltaPagar > 0)
      .map(c => {
        const dueDate = parseISO(c.vencimento!);
        if (!isValid(dueDate)) return null;
        
        const daysUntilDue = differenceInDays(dueDate, today);
        
        let status: DueItem['status'] = 'normal';
        if (daysUntilDue < 0) status = 'overdue';
        else if (daysUntilDue <= 3) status = 'urgent';
        else if (daysUntilDue <= 7) status = 'soon';

        return {
          id: c.id,
          categoria: c.categoria,
          faltaPagar: c.faltaPagar,
          vencimento: c.vencimento!,
          pessoa: c.pessoa,
          moeda: c.moeda || 'BRL',
          daysUntilDue,
          status,
        };
      })
      .filter((item): item is DueItem => item !== null)
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    return dues;
  }, [expenseCategories]);

  const getStatusStyles = (status: DueItem['status']) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400';
      case 'urgent':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400';
      case 'soon':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400';
      default:
        return 'bg-muted border-border';
    }
  };

  const getStatusIcon = (status: DueItem['status']) => {
    switch (status) {
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'soon':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (item: DueItem) => {
    if (item.daysUntilDue < 0) {
      return `${Math.abs(item.daysUntilDue)} dias atrasado`;
    } else if (item.daysUntilDue === 0) {
      return 'Vence hoje!';
    } else if (item.daysUntilDue === 1) {
      return 'Vence amanhã';
    } else {
      return `${item.daysUntilDue} dias`;
    }
  };

  const overdueCount = upcomingDues.filter(d => d.status === 'overdue').length;
  const urgentCount = upcomingDues.filter(d => d.status === 'urgent').length;

  if (upcomingDues.length === 0) {
    return null;
  }

  return (
    <div className="financial-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity w-full text-left"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
          <div className="flex-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              Próximos Vencimentos
              {(overdueCount > 0 || urgentCount > 0) && (
                <span className="flex items-center gap-1 ml-2">
                  {overdueCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {overdueCount} atrasado{overdueCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {urgentCount > 0 && (
                    <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
                    </span>
                  )}
                </span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {upcomingDues.length} pagamento{upcomingDues.length > 1 ? 's' : ''} pendente{upcomingDues.length > 1 ? 's' : ''}
            </p>
          </div>
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 sm:p-6">
          <div className="space-y-3">
            {upcomingDues.map((item) => (
              <div 
                key={item.id}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border-2 transition-colors",
                  getStatusStyles(item.status)
                )}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(item.status)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.categoria || 'Sem nome'}</p>
                    <p className="text-sm opacity-80">
                      Vencimento: {formatDate(item.vencimento)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <PersonBadge person={item.pessoa} />
                  <div className="text-right">
                    <p className="font-mono font-bold text-lg">
                      {formatCurrencyWithSymbol(item.faltaPagar, item.moeda)}
                    </p>
                    <p className={cn(
                      "text-xs font-medium",
                      item.status === 'overdue' && "text-red-600 dark:text-red-400",
                      item.status === 'urgent' && "text-orange-600 dark:text-orange-400"
                    )}>
                      {getStatusText(item)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-muted-foreground">Total a pagar:</span>
            <span className="font-mono font-bold text-xl text-expense">
              {formatCurrency(upcomingDues.reduce((sum, d) => sum + d.faltaPagar, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
