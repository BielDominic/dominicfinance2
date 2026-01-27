import { useState, useMemo } from 'react';
import { 
  Bot, 
  Sparkles, 
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Lightbulb,
  PiggyBank,
  Euro,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IncomeEntry, ExpenseCategory, Investment, FinancialSummary } from '@/types/financial';
import { formatCurrency } from '@/utils/formatters';
import { differenceInDays, parseISO, isValid, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SmartFinancialAssistantProps {
  incomeEntries: IncomeEntry[];
  expenseCategories: ExpenseCategory[];
  investments: Investment[];
  summary: FinancialSummary;
  metaEntradas: number;
  targetDate?: string;
}

interface Insight {
  type: 'success' | 'warning' | 'danger' | 'info' | 'tip';
  icon: React.ReactNode;
  title: string;
  description: string;
  value?: string;
}

export function SmartFinancialAssistant({ 
  incomeEntries, 
  expenseCategories, 
  investments, 
  summary,
  metaEntradas,
  targetDate
}: SmartFinancialAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const insights = useMemo(() => {
    const result: Insight[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Meta de Entradas Progress
    const metaProgress = (summary.totalEntradas / metaEntradas) * 100;
    if (metaProgress >= 100) {
      result.push({
        type: 'success',
        icon: <Target className="h-5 w-5" />,
        title: 'Meta Atingida! 🎉',
        description: `Parabéns! Vocês ultrapassaram a meta de entradas em ${(metaProgress - 100).toFixed(1)}%`,
        value: formatCurrency(summary.totalEntradas),
      });
    } else if (metaProgress >= 80) {
      result.push({
        type: 'success',
        icon: <Target className="h-5 w-5" />,
        title: 'Quase lá!',
        description: `Faltam apenas ${formatCurrency(metaEntradas - summary.totalEntradas)} para atingir a meta`,
        value: `${metaProgress.toFixed(1)}%`,
      });
    } else if (metaProgress >= 50) {
      result.push({
        type: 'info',
        icon: <Target className="h-5 w-5" />,
        title: 'Progresso na Meta',
        description: `Vocês já alcançaram metade da meta. Continuem assim!`,
        value: `${metaProgress.toFixed(1)}%`,
      });
    } else {
      result.push({
        type: 'warning',
        icon: <Target className="h-5 w-5" />,
        title: 'Meta de Entradas',
        description: `Faltam ${formatCurrency(metaEntradas - summary.totalEntradas)} para atingir a meta`,
        value: `${metaProgress.toFixed(1)}%`,
      });
    }

    // 2. Overdue payments
    const overduePayments = expenseCategories.filter(c => {
      if (!c.vencimento || c.faltaPagar <= 0) return false;
      const dueDate = parseISO(c.vencimento);
      return isValid(dueDate) && differenceInDays(dueDate, today) < 0;
    });

    if (overduePayments.length > 0) {
      const totalOverdue = overduePayments.reduce((sum, c) => sum + c.faltaPagar, 0);
      result.push({
        type: 'danger',
        icon: <AlertTriangle className="h-5 w-5" />,
        title: `${overduePayments.length} Pagamento${overduePayments.length > 1 ? 's' : ''} Atrasado${overduePayments.length > 1 ? 's' : ''}!`,
        description: overduePayments.map(c => c.categoria || 'Sem nome').join(', '),
        value: formatCurrency(totalOverdue),
      });
    }

    // 3. Urgent payments (next 7 days)
    const urgentPayments = expenseCategories.filter(c => {
      if (!c.vencimento || c.faltaPagar <= 0) return false;
      const dueDate = parseISO(c.vencimento);
      if (!isValid(dueDate)) return false;
      const days = differenceInDays(dueDate, today);
      return days >= 0 && days <= 7;
    });

    if (urgentPayments.length > 0) {
      const totalUrgent = urgentPayments.reduce((sum, c) => sum + c.faltaPagar, 0);
      result.push({
        type: 'warning',
        icon: <Calendar className="h-5 w-5" />,
        title: `${urgentPayments.length} Vencimento${urgentPayments.length > 1 ? 's' : ''} Próximo${urgentPayments.length > 1 ? 's' : ''}`,
        description: `Pagamentos nos próximos 7 dias: ${urgentPayments.map(c => c.categoria || 'Sem nome').join(', ')}`,
        value: formatCurrency(totalUrgent),
      });
    }

    // 4. Balance analysis
    if (summary.saldoFinalPrevisto > 0) {
      result.push({
        type: 'success',
        icon: <TrendingUp className="h-5 w-5" />,
        title: 'Saldo Positivo Previsto',
        description: 'Ótimo! As entradas cobrem todas as despesas planejadas.',
        value: formatCurrency(summary.saldoFinalPrevisto),
      });
    } else if (summary.saldoFinalPrevisto < 0) {
      result.push({
        type: 'danger',
        icon: <TrendingDown className="h-5 w-5" />,
        title: 'Atenção: Saldo Negativo',
        description: 'As despesas superam as entradas. Revise os gastos ou busque entradas adicionais.',
        value: formatCurrency(summary.saldoFinalPrevisto),
      });
    }

    // 5. Future income potential
    if (summary.totalFuturos > 0) {
      result.push({
        type: 'info',
        icon: <Sparkles className="h-5 w-5" />,
        title: 'Entradas Futuras Previstas',
        description: 'Com as entradas futuras, o saldo final será ainda melhor!',
        value: formatCurrency(summary.saldoFinalComFuturos),
      });
    }

    // 6. Payment progress
    const paymentProgress = summary.totalSaidas > 0 ? (summary.totalPago / summary.totalSaidas) * 100 : 0;
    if (paymentProgress >= 80) {
      result.push({
        type: 'success',
        icon: <CheckCircle2 className="h-5 w-5" />,
        title: 'Pagamentos Quase Completos',
        description: `${paymentProgress.toFixed(0)}% das despesas já foram pagas!`,
        value: formatCurrency(summary.totalPago),
      });
    } else if (paymentProgress >= 50) {
      result.push({
        type: 'info',
        icon: <PiggyBank className="h-5 w-5" />,
        title: 'Progresso nos Pagamentos',
        description: `Metade das despesas já pagas. Faltam ${formatCurrency(summary.totalAPagar)}`,
        value: `${paymentProgress.toFixed(0)}%`,
      });
    }

    // 7. EUR conversion insight
    if (summary.saldoAposCambioEUR > 0) {
      result.push({
        type: 'info',
        icon: <Euro className="h-5 w-5" />,
        title: 'Saldo em Euros',
        description: `Com a taxa atual (1 EUR = R$ ${summary.taxaCambio.toFixed(2)}), seu saldo será aproximadamente:`,
        value: `€${summary.saldoAposCambioEUR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      });
    }

    // 8. Days until trip
    if (targetDate) {
      const tripDate = parseISO(targetDate);
      if (isValid(tripDate)) {
        const daysUntilTrip = differenceInDays(tripDate, today);
        if (daysUntilTrip > 0) {
          const monthsUntilTrip = Math.floor(daysUntilTrip / 30);
          const weeksUntilTrip = Math.floor(daysUntilTrip / 7);
          
          // Calculate suggested monthly savings
          const remainingToSave = summary.totalAPagar;
          const monthlySavingNeeded = monthsUntilTrip > 0 ? remainingToSave / monthsUntilTrip : remainingToSave;
          
          if (monthsUntilTrip > 0 && remainingToSave > 0) {
            result.push({
              type: 'tip',
              icon: <Lightbulb className="h-5 w-5" />,
              title: 'Sugestão de Economia',
              description: `Economize ${formatCurrency(monthlySavingNeeded)} por mês para quitar tudo até a viagem em ${format(tripDate, "MMMM 'de' yyyy", { locale: ptBR })}`,
              value: `${daysUntilTrip} dias`,
            });
          }
        }
      }
    }

    // 9. Person balance analysis
    const gabrielEntries = incomeEntries.filter(e => e.pessoa === 'Gabriel' && e.status === 'Entrada');
    const myrelleEntries = incomeEntries.filter(e => e.pessoa === 'Myrelle' && e.status === 'Entrada');
    const gabrielTotal = gabrielEntries.reduce((sum, e) => sum + e.valor, 0);
    const myrelleTotal = myrelleEntries.reduce((sum, e) => sum + e.valor, 0);
    
    if (gabrielTotal > 0 && myrelleTotal > 0) {
      const diff = Math.abs(gabrielTotal - myrelleTotal);
      const total = gabrielTotal + myrelleTotal;
      const diffPercent = (diff / total) * 100;
      
      if (diffPercent > 30) {
        const higher = gabrielTotal > myrelleTotal ? 'Gabriel' : 'Myrelle';
        result.push({
          type: 'info',
          icon: <TrendingUp className="h-5 w-5" />,
          title: 'Contribuição por Pessoa',
          description: `${higher} contribuiu mais até agora. Diferença de ${formatCurrency(diff)}`,
          value: `${diffPercent.toFixed(0)}% diferença`,
        });
      }
    }

    // 10. Investment tracking
    const totalInvestments = investments.reduce((sum, i) => sum + i.valor, 0);
    if (totalInvestments > 0) {
      result.push({
        type: 'success',
        icon: <PiggyBank className="h-5 w-5" />,
        title: 'Reservas e Investimentos',
        description: `Vocês têm reservas distribuídas em ${investments.length} categoria${investments.length > 1 ? 's' : ''}`,
        value: formatCurrency(totalInvestments),
      });
    }

    // 11. Tips based on situation
    if (result.filter(r => r.type === 'danger').length === 0 && summary.saldoFinalPrevisto > 1000) {
      result.push({
        type: 'tip',
        icon: <Lightbulb className="h-5 w-5" />,
        title: 'Dica: Reserva de Emergência',
        description: 'Considere manter 10-20% do saldo como reserva para imprevistos na viagem',
        value: formatCurrency(summary.saldoFinalPrevisto * 0.15),
      });
    }

    return result;
  }, [incomeEntries, expenseCategories, investments, summary, metaEntradas, targetDate, refreshKey]);

  const getTypeStyles = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400';
      case 'warning':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400';
      case 'danger':
        return 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400';
      case 'tip':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400';
    }
  };

  const successCount = insights.filter(i => i.type === 'success').length;
  const warningCount = insights.filter(i => i.type === 'warning' || i.type === 'danger').length;

  return (
    <div className="financial-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5">
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
              <div className="relative">
                <Bot className="h-5 w-5 text-primary" />
                <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
              </div>
              Assistente Financeiro
              <span className="text-xs font-normal bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full ml-2">
                ∞ Sem limites
              </span>
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              {insights.length} insights • 
              <span className="text-emerald-600 dark:text-emerald-400">{successCount} positivos</span> • 
              <span className="text-orange-600 dark:text-orange-400">{warningCount} alertas</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setRefreshKey(k => k + 1);
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, index) => (
              <div 
                key={index}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border-2 transition-all hover:scale-[1.01]",
                  getTypeStyles(insight.type)
                )}
              >
                <div className="shrink-0 mt-0.5">
                  {insight.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{insight.title}</p>
                    {insight.value && (
                      <span className="font-mono font-bold text-sm whitespace-nowrap">
                        {insight.value}
                      </span>
                    )}
                  </div>
                  <p className="text-sm opacity-80 mt-1">
                    {insight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {insights.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Adicione mais dados para receber insights personalizados!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
